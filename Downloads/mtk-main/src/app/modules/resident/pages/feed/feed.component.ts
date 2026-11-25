import {
    ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild, ViewEncapsulation,
} from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { DateTime } from 'luxon';
import { TranslocoModule, TranslocoService } from '@ngneat/transloco';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { Observable, Subject, finalize, takeUntil, timer } from 'rxjs';
import { FeedService, insertAfterPinned, sortFeedPosts } from 'app/core/services/resident/feed.service';
import { NotificationService } from 'app/core/services/notification.service';
import { ComplaintPrefillService } from 'app/core/services/resident/complaint-prefill.service';
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

@Component({
    selector        : 'resident-feed',
    templateUrl     : './feed.component.html',
    styleUrls       : ['./feed.component.scss'],
    encapsulation   : ViewEncapsulation.None,
    changeDetection : ChangeDetectionStrategy.OnPush,
    standalone      : true,
    imports         : [CommonModule, FormsModule, TranslocoModule, MatButtonModule, MatIconModule, MatMenuModule],
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
    loadError = false;
    loadingMore = false;
    /** Post opened through a shared link (`/resident/feed/:id`): highlighted and scrolled into view. */
    focusedPostId: number | null = null;
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

    private _page = 0;
    private _routePostId: number | null = null;
    /** Local changes (publish / delete / pin) shift server pages, so the next "load more" refetches from page 1. */
    private _needsResync = false;
    private _likingIds = new Set<number>();
    private _deletingPostIds = new Set<number>();
    private _pinningIds = new Set<number>();
    private _closingPreviews = false;
    private _deletingCommentIds = new Set<number>();
    private _safeUrls = new Map<string, SafeUrl>();
    private _unsubscribeAll = new Subject<void>();

    constructor(
        private _feedService:         FeedService,
        private _notificationService: NotificationService,
        private _sanitizer:           DomSanitizer,
        private _confirmationService: FuseConfirmationService,
        private _translocoService:    TranslocoService,
        private _complaintPrefill:    ComplaintPrefillService,
        private _router:              Router,
        private _route:               ActivatedRoute,
        private _location:            Location,
        private _host:                ElementRef<HTMLElement>,
        private _cdr:                 ChangeDetectorRef,
    ) {}

    ngOnInit(): void {
        // The same component serves `feed` and `feed/:id`; the id may change while it stays alive.
        this._route.paramMap
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((params) => {
                const id = Number(params.get('id'));
                this._routePostId = Number.isInteger(id) && id > 0 ? id : null;
                if (!this.loading && !this.loadError) {
                    this._focusRoutePost();
                }
            });

        this._loadFirstPage();
    }

    retryLoad(): void {
        if (this.loading) return;
        this._loadFirstPage();
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

    /** Previews stay rendered while the panel is collapsing, so nothing jumps. */
    get previewsOpen(): boolean {
        return this.attachments.length > 0 && !this._closingPreviews;
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

    private _loadFirstPage(): void {
        this.loading = true;
        this.loadError = false;
        this._cdr.markForCheck();

        this._feedService.getPosts(1, PAGE_SIZE)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (res) => {
                    if (!res.status) {
                        this._failFirstLoad();
                        return;
                    }
                    this.posts = sortFeedPosts(res.data?.result ?? []);
                    this.totalCount = res.data?.count ?? this.posts.length;
                    this._page = 1;
                    this._needsResync = false;
                    this.loading = false;
                    this._cdr.markForCheck();
                    this._focusRoutePost();
                },
                error: () => this._failFirstLoad(),
            });
    }

    private _failFirstLoad(): void {
        this.loading = false;
        this.loadError = true;
        this._cdr.markForCheck();
    }

    // ── Permalink (/resident/feed/:id) ──────────────────────────────────

    private _focusRoutePost(): void {
        const id = this._routePostId;
        if (id === null) {
            this.focusedPostId = null;
            this._cdr.markForCheck();
            return;
        }

        this.activeFilter = 'all';   // the target must not be hidden by a filter
        if (this.posts.some(p => p.id === id)) {
            this._revealPost(id);
            return;
        }

        // Not on the loaded pages: fetch it separately and show it at the top, below the pinned posts.
        this._feedService.getPostById(id)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (res) => {
                    if (this._routePostId !== id) return;   // the route changed meanwhile
                    if (!res.status || !res.data) {
                        this._postNotFound();
                        return;
                    }
                    if (!this.posts.some(p => p.id === id)) {
                        this.posts = insertAfterPinned(this.posts, res.data);
                    }
                    this._revealPost(id);
                },
                error: () => this._postNotFound(),
            });
    }

    private _revealPost(id: number): void {
        this.focusedPostId = id;
        this._cdr.markForCheck();

        // Wait until the entry animations have settled, otherwise the scroll target is still moving.
        timer(450)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(() => {
                const el = this._host.nativeElement.querySelector<HTMLElement>(`#feed-post-${id}`);
                const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
                el?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
            });
    }

    private _postNotFound(): void {
        this.focusedPostId = null;
        this._notificationService.info(this._t('notFound'));
        this._router.navigate(['/resident/feed'], { replaceUrl: true });
    }

    backToFeed(): void {
        this._router.navigate(['/resident/feed']);
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
                    // A resync replaces the list; the post opened via a shared link must not vanish from under the user.
                    const focused = this.posts.find(p => p.id === this.focusedPostId);
                    const fresh = focused && !items.some(p => p.id === focused.id) ? insertAfterPinned(items, focused) : items;
                    this.posts = sortFeedPosts(resync ? fresh : [...this.posts, ...items.filter(p => !known.has(p.id))]);
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

        this._closingPreviews = false;
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
        if (this.publishing) return;
        if (this.attachments.length > 1) {
            this._dropAttachments([attachment]);
        } else {
            this._closePreviews(() => this._dropAttachments([attachment]));
        }
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
                        const sent = [...this.attachments];
                        this._closePreviews(() => this._dropAttachments(sent));
                    } else {
                        this._notificationService.info(res.message);
                    }
                },
                error: () => this._notificationService.error('Paylaşım göndərilmədi'),
            });
    }

    /** Menu action: asks first, the actual deletion happens in `deletePost`. */
    confirmDeletePost(post: FeedPost): void {
        this._confirmationService.open({
            title:   this._t('confirmation.delete.title'),
            message: this._t('confirmation.delete.message'),
            icon:    { show: true, name: 'heroicons_outline:exclamation-triangle', color: 'warn' },
            actions: {
                confirm: { show: true, label: 'common.actions.delete', color: 'warn' },
                cancel:  { show: true, label: 'common.actions.cancel' },
            },
            dismissible: true,
        }).afterClosed().subscribe((result) => {
            if (result === 'confirmed') {
                this.deletePost(post);
            }
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
        if (this._pinningIds.has(post.id)) return;
        this._pinningIds.add(post.id);

        this._feedService.setPinned(post.id, !post.pinned)
            .pipe(
                takeUntil(this._unsubscribeAll),
                finalize(() => this._pinningIds.delete(post.id)),
            )
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

    // ── Posts: share / complaint ────────────────────────────────────────

    async sharePost(post: FeedPost): Promise<void> {
        const copied = await this._copyToClipboard(this._postUrl(post.id));
        if (copied) {
            this._notificationService.success(this._t('share.copied'));
        } else {
            this._notificationService.error(this._t('share.failed'));
        }
    }

    /** Opens "Müraciətlər" with the create dialog pre-filled from the post. */
    createComplaint(post: FeedPost): void {
        const quote = post.text.length > 280 ? `${post.text.slice(0, 280)}…` : post.text;
        this._complaintPrefill.set({
            title:       this._t('complaint.title'),
            description: this._t('complaint.body', { text: quote || post.author, link: this._postUrl(post.id) }),
        });
        this._router.navigate(['/resident/request']);
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

    /** Relative time in Azerbaijani (Intl relative formats are not reliable for `az` across browsers). */
    timeAgo(iso: string): string {
        const date = DateTime.fromISO(iso);
        if (!date.isValid) return '';

        const minutes = Math.floor((Date.now() - date.toMillis()) / 60_000);
        if (minutes < 1)  return 'indicə';
        if (minutes < 60) return `${minutes} dəqiqə əvvəl`;

        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours} saat əvvəl`;

        const days = Math.floor(hours / 24);
        if (days === 1) return 'dünən';
        if (days < 7)   return `${days} gün əvvəl`;

        return date.toFormat('dd.MM.yyyy');
    }

    private _t(key: string, params?: Record<string, unknown>): string {
        return this._translocoService.translate(`resident.feed.${key}`, params);
    }

    /** Absolute link to a post; respects the app's base href / location strategy. */
    private _postUrl(id: number): string {
        const path = this._router.serializeUrl(this._router.createUrlTree(['/resident/feed', id]));
        return window.location.origin + this._location.prepareExternalUrl(path);
    }

    private async _copyToClipboard(text: string): Promise<boolean> {
        try {
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(text);
                return true;
            }
        } catch {
            // permission denied or insecure context: use the fallback below
        }
        try {
            const area = document.createElement('textarea');
            area.value = text;
            area.setAttribute('readonly', '');
            area.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
            document.body.appendChild(area);
            area.select();
            const ok = document.execCommand('copy');
            document.body.removeChild(area);
            return ok;
        } catch {
            return false;
        }
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

    /** Collapses the previews panel first, then runs `then` (which actually removes the files). */
    private _closePreviews(then: () => void): void {
        this._closingPreviews = true;
        this._cdr.markForCheck();
        timer(REMOVE_ANIMATION_MS)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(() => {
                then();
                this._closingPreviews = false;
                this._cdr.markForCheck();
            });
    }

    private _dropAttachments(items: Attachment[]): void {
        items.forEach(a => URL.revokeObjectURL(a.previewUrl));
        this.attachments = this.attachments.filter(a => !items.includes(a));
        this._cdr.markForCheck();
    }

    private _revokeAttachments(): void {
        this.attachments.forEach(a => URL.revokeObjectURL(a.previewUrl));
        this.attachments = [];
    }
}
