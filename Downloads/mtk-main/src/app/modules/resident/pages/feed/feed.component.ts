import {
    ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild, ViewEncapsulation,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { DateTime } from 'luxon';
import { Observable, Subject, finalize, takeUntil, timer } from 'rxjs';
import { FeedService, insertAfterPinned, sortFeedPosts } from 'app/core/services/resident/feed.service';
import { NotificationService } from 'app/core/services/notification.service';
import { FeedComment, FeedMedia, FeedPost } from 'app/core/models/resident/feed.types';
import { ApiResponse, PaginatedResponse } from 'app/core/models/api-response.model';

type FeedFilter = 'all' | 'official' | 'mine';
type ToolAction = 'photo' | 'video' | 'emoji' | 'location';

interface Attachment {
    file:       File;
    type:       'image' | 'video';
    previewUrl: string;
    safeUrl:    SafeUrl;
}

const PAGE_SIZE        = 5;
const MAX_ATTACHMENTS  = 4;
const MAX_IMAGE_MB     = 10;
const MAX_VIDEO_MB     = 50;
/** Must match the collapse transition duration in feed.component.scss */
const REMOVE_ANIMATION_MS = 320;
const LIKE_POP_MS         = 450;

@Component({
    selector        : 'resident-feed',
    templateUrl     : './feed.component.html',
    styleUrls       : ['./feed.component.scss'],
    encapsulation   : ViewEncapsulation.None,
    changeDetection : ChangeDetectionStrategy.OnPush,
    standalone      : true,
    imports         : [CommonModule, FormsModule, MatButtonModule, MatIconModule, MatMenuModule],
})
export class ResidentFeedComponent implements OnInit, OnDestroy {
    @ViewChild('photoInput') photoInput?: ElementRef<HTMLInputElement>;
    @ViewChild('videoInput') videoInput?: ElementRef<HTMLInputElement>;

    readonly currentUser = { name: 'İbrahim Süleymanzadə', initials: 'is' };

    // Mock flag: admin actions (pin / delete any post or comment) are visible only when true.
    isAdmin = true;

    // ── Composer ────────────────────────────────────────────────────────
    draft = '';
    audience = 'Bütün sakinlər';
    audiences = ['Bütün sakinlər', 'Mənim blokum', 'Mənim mərtəbəm'];
    attachments: Attachment[] = [];
    publishing = false;

    tools: { action: ToolAction; label: string; icon: string; color: string }[] = [
        { action: 'photo',    label: 'Foto',  icon: 'heroicons_outline:photo',        color: 'text-green-500' },
        { action: 'video',    label: 'Video', icon: 'heroicons_outline:video-camera', color: 'text-rose-500' },
        { action: 'emoji',    label: '',      icon: 'heroicons_outline:face-smile',   color: 'text-amber-500' },
        { action: 'location', label: '',      icon: 'heroicons_outline:map-pin',      color: 'text-indigo-500' },
    ];

    // ── Feed ────────────────────────────────────────────────────────────
    filters: { key: FeedFilter; label: string }[] = [
        { key: 'all',      label: 'Hamısı' },
        { key: 'official', label: 'Rəsmi' },
        { key: 'mine',     label: 'Mənim' },
    ];
    activeFilter: FeedFilter = 'all';

    posts: FeedPost[] = [];
    loading = true;
    loadingMore = false;
    totalCount = 0;

    // Comments UI state
    expandedPostIds = new Set<number>();
    commentDrafts: Record<number, string> = {};
    commentingIds = new Set<number>();

    // Editing state
    editingPostId: number | null = null;
    postEditDraft = '';
    savingPostEdit = false;
    editingCommentId: number | null = null;
    commentEditDraft = '';
    savingCommentEdit = false;

    // Animation state
    removingPostIds = new Set<number>();
    removingCommentIds = new Set<number>();
    likePopIds = new Set<number>();

    private _page = 0;
    /** Local changes (publish / delete / pin) shift server pages, so the next "load more" refetches from page 1. */
    private _needsResync = false;
    private _likingIds = new Set<number>();
    private _deletingPostIds = new Set<number>();
    private _deletingCommentIds = new Set<number>();
    private _safeUrls = new Map<string, SafeUrl>();
    private _unsubscribeAll = new Subject<void>();

    constructor(
        private _feedService:         FeedService,
        private _notificationService: NotificationService,
        private _sanitizer:           DomSanitizer,
        private _cdr:                 ChangeDetectorRef,
    ) {}

    ngOnInit(): void {
        this._feedService.getPosts(1, PAGE_SIZE)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (res) => {
                    this.posts = sortFeedPosts(res.data?.result ?? []);
                    this.totalCount = res.data?.count ?? this.posts.length;
                    this._page = 1;
                    this.loading = false;
                    this._cdr.markForCheck();
                },
                error: () => {
                    this.loading = false;
                    this._notificationService.error('Lenta yüklənmədi');
                    this._cdr.markForCheck();
                },
            });
    }

    ngOnDestroy(): void {
        this._revokeAttachments();
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }

    // ── Derived state ───────────────────────────────────────────────────

    get filteredPosts(): FeedPost[] {
        switch (this.activeFilter) {
            case 'official': return this.posts.filter(p => p.official);
            case 'mine':     return this.posts.filter(p => p.mine);
            default:         return this.posts;
        }
    }

    get hasMore(): boolean {
        return this.posts.length < this.totalCount;
    }

    get canPublish(): boolean {
        return (!!this.draft.trim() || this.attachments.length > 0) && !this.publishing;
    }

    canDeleteComment(comment: FeedComment): boolean {
        return this.isAdmin || comment.mine;
    }

    trackById(_: number, item: { id: number }): number {
        return item.id;
    }

    // ── Pagination ──────────────────────────────────────────────────────

    loadMore(): void {
        if (this.loadingMore || !this.hasMore) return;
        this.loadingMore = true;

        const nextPage = this._page + 1;
        const resync = this._needsResync;
        const request$: Observable<ApiResponse<PaginatedResponse<FeedPost>>> = resync
            ? this._feedService.getPosts(1, nextPage * PAGE_SIZE)
            : this._feedService.getPosts(nextPage, PAGE_SIZE);

        request$
            .pipe(
                takeUntil(this._unsubscribeAll),
                finalize(() => {
                    this.loadingMore = false;
                    this._cdr.markForCheck();
                }),
            )
            .subscribe({
                next: (res) => {
                    const items = res.data?.result ?? [];
                    const known = new Set(this.posts.map(p => p.id));
                    this.posts = sortFeedPosts(resync ? items : [...this.posts, ...items.filter(p => !known.has(p.id))]);
                    this.totalCount = items.length ? (res.data?.count ?? this.posts.length) : this.posts.length;
                    this._page = nextPage;
                    this._needsResync = false;
                },
                error: () => this._notificationService.error('Yeni paylaşımlar yüklənmədi'),
            });
    }

    // ── Composer: media ─────────────────────────────────────────────────

    onToolClick(action: ToolAction): void {
        if (action === 'photo') this.photoInput?.nativeElement.click();
        if (action === 'video') this.videoInput?.nativeElement.click();
    }

    onFilesSelected(event: Event, type: 'image' | 'video'): void {
        const input = event.target as HTMLInputElement;
        const files = Array.from(input.files ?? []);
        input.value = '';   // allow picking the same file again

        const maxMb = type === 'image' ? MAX_IMAGE_MB : MAX_VIDEO_MB;
        for (const file of files) {
            if (this.attachments.length >= MAX_ATTACHMENTS) {
                this._notificationService.warning(`Maksimum ${MAX_ATTACHMENTS} fayl əlavə etmək olar`);
                break;
            }
            if (file.size > maxMb * 1024 * 1024) {
                this._notificationService.warning(`"${file.name}" çox böyükdür (maks. ${maxMb} MB)`);
                continue;
            }
            const previewUrl = URL.createObjectURL(file);
            this.attachments = [...this.attachments, {
                file, type, previewUrl, safeUrl: this._sanitizer.bypassSecurityTrustUrl(previewUrl),
            }];
        }
        this._cdr.markForCheck();
    }

    removeAttachment(attachment: Attachment): void {
        URL.revokeObjectURL(attachment.previewUrl);
        this.attachments = this.attachments.filter(a => a !== attachment);
    }

    /** Media of a published post. Blob URLs (mock mode) need to be trusted; the result is cached to keep bindings stable. */
    mediaSrc(media: FeedMedia): string | SafeUrl {
        if (!media.url.startsWith('blob:')) return media.url;
        let safe = this._safeUrls.get(media.url);
        if (!safe) {
            safe = this._sanitizer.bypassSecurityTrustUrl(media.url);
            this._safeUrls.set(media.url, safe);
        }
        return safe;
    }

    // ── Posts ───────────────────────────────────────────────────────────

    publish(): void {
        if (!this.canPublish) return;
        const text = this.draft.trim();

        this.publishing = true;
        this._feedService.createPost({ text, audience: this.audience, files: this.attachments.map(a => a.file) })
            .pipe(
                takeUntil(this._unsubscribeAll),
                finalize(() => {
                    this.publishing = false;
                    this._cdr.markForCheck();
                }),
            )
            .subscribe({
                next: (res) => {
                    if (res.status) {
                        // Never prepend: pinned posts stay first, the new post goes right after them.
                        this.posts = insertAfterPinned(this.posts, res.data);
                        this.totalCount++;
                        this._needsResync = true;
                        this.draft = '';
                        this._revokeAttachments();
                    } else {
                        this._notificationService.info(res.message);
                    }
                },
                error: () => this._notificationService.error('Paylaşım göndərilmədi'),
            });
    }

    deletePost(post: FeedPost): void {
        if (this._deletingPostIds.has(post.id)) return;
        this._deletingPostIds.add(post.id);

        this._feedService.deletePost(post.id)
            .pipe(
                takeUntil(this._unsubscribeAll),
                finalize(() => this._deletingPostIds.delete(post.id)),
            )
            .subscribe({
                next: (res) => {
                    if (!res.status) {
                        this._notificationService.info(res.message);
                        return;
                    }
                    this._animateRemoval(this.removingPostIds, post.id, () => {
                        this.posts = this.posts.filter(p => p.id !== post.id);
                        this.expandedPostIds.delete(post.id);
                        this.totalCount = Math.max(0, this.totalCount - 1);
                        this._needsResync = true;
                    });
                },
                error: () => this._notificationService.error('Silinmə zamanı xəta baş verdi'),
            });
    }

    togglePin(post: FeedPost): void {
        this._feedService.setPinned(post.id, !post.pinned)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (res) => {
                    if (!res.status) {
                        this._notificationService.info(res.message);
                        return;
                    }
                    const updated = res.data;
                    // A newly pinned post goes first among the pinned; an unpinned one keeps its place.
                    this.posts = sortFeedPosts(
                        updated.pinned
                            ? [updated, ...this.posts.filter(p => p.id !== updated.id)]
                            : this.posts.map(p => (p.id === updated.id ? updated : p)),
                    );
                    this._needsResync = true;
                    this._cdr.markForCheck();
                },
                error: () => this._notificationService.error('Əməliyyat zamanı xəta baş verdi'),
            });
    }

    toggleLike(post: FeedPost): void {
        if (this._likingIds.has(post.id)) return;   // ignore clicks while the request is in flight
        this._likingIds.add(post.id);

        // Optimistic update: the heart reacts instantly, the server response is the source of truth.
        const liked = !post.liked;
        this._patchPost(post.id, { liked, likes: Math.max(0, post.likes + (liked ? 1 : -1)) });
        if (liked) this._flag(this.likePopIds, post.id, LIKE_POP_MS);

        this._feedService.toggleLike(post.id)
            .pipe(
                takeUntil(this._unsubscribeAll),
                finalize(() => this._likingIds.delete(post.id)),
            )
            .subscribe({
                next: (res) => {
                    if (res.status) {
                        this._patchPost(post.id, { liked: res.data.liked, likes: res.data.likes });
                    } else {
                        this._patchPost(post.id, { liked: post.liked, likes: post.likes });
                        this._notificationService.info(res.message);
                    }
                },
                error: () => {
                    this._patchPost(post.id, { liked: post.liked, likes: post.likes });
                    this._notificationService.error('Əməliyyat zamanı xəta baş verdi');
                },
            });
    }

    // ── Posts: editing ──────────────────────────────────────────────────

    startEditPost(post: FeedPost): void {
        this.editingPostId = post.id;
        this.postEditDraft = post.text;
    }

    cancelEditPost(): void {
        this.editingPostId = null;
        this.postEditDraft = '';
    }

    savePostEdit(post: FeedPost): void {
        const text = this.postEditDraft.trim();
        if (!text || this.savingPostEdit) return;
        if (text === post.text) {
            this.cancelEditPost();
            return;
        }

        this.savingPostEdit = true;
        this._feedService.updatePost({ id: post.id, text })
            .pipe(
                takeUntil(this._unsubscribeAll),
                finalize(() => {
                    this.savingPostEdit = false;
                    this._cdr.markForCheck();
                }),
            )
            .subscribe({
                next: (res) => {
                    if (res.status) {
                        this.cancelEditPost();
                        this._patchPost(post.id, { text: res.data.text, edited: true });
                    } else {
                        this._notificationService.info(res.message);
                    }
                },
                error: () => this._notificationService.error('Dəyişiklik saxlanılmadı'),
            });
    }

    // ── Comments ────────────────────────────────────────────────────────

    toggleComments(post: FeedPost): void {
        if (this.expandedPostIds.has(post.id)) {
            this.expandedPostIds.delete(post.id);
        } else {
            this.expandedPostIds.add(post.id);
        }
    }

    canSendComment(post: FeedPost): boolean {
        return !!(this.commentDrafts[post.id] ?? '').trim() && !this.commentingIds.has(post.id);
    }

    sendComment(post: FeedPost): void {
        const text = (this.commentDrafts[post.id] ?? '').trim();
        if (!text || this.commentingIds.has(post.id)) return;

        this.commentingIds.add(post.id);
        this._feedService.addComment({ postId: post.id, text })
            .pipe(
                takeUntil(this._unsubscribeAll),
                finalize(() => {
                    this.commentingIds.delete(post.id);
                    this._cdr.markForCheck();
                }),
            )
            .subscribe({
                next: (res) => {
                    if (res.status) {
                        // Read the post from the current list: it may have changed (like, pin) meanwhile.
                        const current = this.posts.find(p => p.id === post.id);
                        if (current) {
                            this._patchPost(post.id, { comments: [...current.comments, res.data] });
                        }
                        this.commentDrafts[post.id] = '';
                    } else {
                        this._notificationService.info(res.message);
                    }
                },
                error: () => this._notificationService.error('Şərh göndərilmədi'),
            });
    }

    startEditComment(comment: FeedComment): void {
        this.editingCommentId = comment.id;
        this.commentEditDraft = comment.text;
    }

    cancelEditComment(): void {
        this.editingCommentId = null;
        this.commentEditDraft = '';
    }

    saveCommentEdit(post: FeedPost, comment: FeedComment): void {
        const text = this.commentEditDraft.trim();
        if (!text || this.savingCommentEdit) return;
        if (text === comment.text) {
            this.cancelEditComment();
            return;
        }

        this.savingCommentEdit = true;
        this._feedService.updateComment({ postId: post.id, commentId: comment.id, text })
            .pipe(
                takeUntil(this._unsubscribeAll),
                finalize(() => {
                    this.savingCommentEdit = false;
                    this._cdr.markForCheck();
                }),
            )
            .subscribe({
                next: (res) => {
                    if (res.status) {
                        const current = this.posts.find(p => p.id === post.id);
                        this.cancelEditComment();
                        if (current) {
                            this._patchPost(post.id, {
                                comments: current.comments.map(c => (c.id === comment.id ? res.data : c)),
                            });
                        }
                    } else {
                        this._notificationService.info(res.message);
                    }
                },
                error: () => this._notificationService.error('Dəyişiklik saxlanılmadı'),
            });
    }

    deleteComment(post: FeedPost, comment: FeedComment): void {
        if (!this.canDeleteComment(comment) || this._deletingCommentIds.has(comment.id)) return;

        this._deletingCommentIds.add(comment.id);
        this._feedService.deleteComment(post.id, comment.id)
            .pipe(
                takeUntil(this._unsubscribeAll),
                finalize(() => this._deletingCommentIds.delete(comment.id)),
            )
            .subscribe({
                next: (res) => {
                    if (!res.status) {
                        this._notificationService.info(res.message);
                        return;
                    }
                    this._animateRemoval(this.removingCommentIds, comment.id, () => {
                        const current = this.posts.find(p => p.id === post.id);
                        if (current) {
                            this._patchPost(post.id, { comments: current.comments.filter(c => c.id !== comment.id) });
                        }
                    });
                },
                error: () => this._notificationService.error('Şərh silinmədi'),
            });
    }

    // ── Utils ───────────────────────────────────────────────────────────

    timeAgo(iso: string): string {
        const date = DateTime.fromISO(iso);
        if (!date.isValid) return '';
        if (Math.abs(date.diffNow('seconds').seconds) < 60) return 'indicə';
        return date.setLocale('az').toRelative() ?? '';
    }

    private _patchPost(id: number, patch: Partial<FeedPost>): void {
        this.posts = this.posts.map(p => (p.id === id ? { ...p, ...patch } : p));
        this._cdr.markForCheck();
    }

    /** Adds `id` to a "removing" set (CSS plays the collapse), then runs `then` once the animation is over. */
    private _animateRemoval(ids: Set<number>, id: number, then: () => void): void {
        ids.add(id);
        this._cdr.markForCheck();
        timer(REMOVE_ANIMATION_MS)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(() => {
                then();
                ids.delete(id);
                this._cdr.markForCheck();
            });
    }

    /** Keeps `id` in a set for a limited time (drives short one-shot CSS animations). */
    private _flag(ids: Set<number>, id: number, ms: number): void {
        ids.add(id);
        this._cdr.markForCheck();
        timer(ms)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(() => {
                ids.delete(id);
                this._cdr.markForCheck();
            });
    }

    private _revokeAttachments(): void {
        this.attachments.forEach(a => URL.revokeObjectURL(a.previewUrl));
        this.attachments = [];
    }
}
