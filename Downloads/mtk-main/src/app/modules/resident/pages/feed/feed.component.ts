import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { DateTime } from 'luxon';
import { Subject, finalize, takeUntil } from 'rxjs';
import { FeedService, insertAfterPinned, sortFeedPosts } from 'app/core/services/resident/feed.service';
import { NotificationService } from 'app/core/services/notification.service';
import { FeedComment, FeedPost } from 'app/core/models/resident/feed.types';

type FeedFilter = 'all' | 'official' | 'mine';

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
    readonly currentUser = { name: 'İbrahim Süleymanzadə', initials: 'is' };

    // Mock flag: admin actions (pin / delete) are visible only when true.
    isAdmin = true;

    draft = '';
    audience = 'Bütün sakinlər';
    audiences = ['Bütün sakinlər', 'Mənim blokum', 'Mənim mərtəbəm'];

    tools = [
        { label: 'Foto',  icon: 'heroicons_outline:photo',        color: 'text-green-500' },
        { label: 'Video', icon: 'heroicons_outline:video-camera', color: 'text-rose-500' },
        { label: '',      icon: 'heroicons_outline:face-smile',   color: 'text-amber-500' },
        { label: '',      icon: 'heroicons_outline:map-pin',      color: 'text-indigo-500' },
    ];

    filters: { key: FeedFilter; label: string }[] = [
        { key: 'all',      label: 'Hamısı' },
        { key: 'official', label: 'Rəsmi' },
        { key: 'mine',     label: 'Mənim' },
    ];
    activeFilter: FeedFilter = 'all';

    posts: FeedPost[] = [];
    loading = true;
    publishing = false;

    private _unsubscribeAll = new Subject<void>();
    private _likingIds = new Set<number>();

    // Comments UI state
    expandedPostIds = new Set<number>();
    commentDrafts: Record<number, string> = {};
    commentingIds = new Set<number>();

    constructor(
        private _feedService:         FeedService,
        private _notificationService: NotificationService,
        private _cdr:                 ChangeDetectorRef,
    ) {}

    ngOnInit(): void {
        this._feedService.getPosts()
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (res) => {
                    this.posts = sortFeedPosts(res.data?.result ?? []);
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
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }

    get filteredPosts(): FeedPost[] {
        switch (this.activeFilter) {
            case 'official': return this.posts.filter(p => p.official);
            case 'mine':     return this.posts.filter(p => p.mine);
            default:         return this.posts;
        }
    }

    trackById(_: number, post: FeedPost): number {
        return post.id;
    }

    deletePost(post: FeedPost): void {
        this._feedService.deletePost(post.id)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (res) => {
                    if (res.status) {
                        this.posts = this.posts.filter(p => p.id !== post.id);
                        this._cdr.markForCheck();
                    } else {
                        this._notificationService.info(res.message);
                    }
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

    publish(): void {
        const text = this.draft.trim();
        if (!text || this.publishing) return;

        this.publishing = true;
        this._feedService.createPost({ text, audience: this.audience })
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
                        this.draft = '';
                    } else {
                        this._notificationService.info(res.message);
                    }
                },
                error: () => this._notificationService.error('Paylaşım göndərilmədi'),
            });
    }

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

    trackByCommentId(_: number, comment: FeedComment): number {
        return comment.id;
    }

    private _patchPost(id: number, patch: Partial<FeedPost>): void {
        this.posts = this.posts.map(p => (p.id === id ? { ...p, ...patch } : p));
        this._cdr.markForCheck();
    }

    timeAgo(iso: string): string {
        const date = DateTime.fromISO(iso);
        if (!date.isValid) return '';
        if (Math.abs(date.diffNow('seconds').seconds) < 60) return 'indicə';
        return date.setLocale('az').toRelative() ?? '';
    }
}
