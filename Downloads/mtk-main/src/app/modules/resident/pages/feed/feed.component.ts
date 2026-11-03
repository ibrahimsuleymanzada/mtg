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
import { FeedPost } from 'app/core/models/resident/feed.types';

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
        post.liked = !post.liked;
        post.likes += post.liked ? 1 : -1;
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

    timeAgo(iso: string): string {
        const date = DateTime.fromISO(iso);
        if (!date.isValid) return '';
        if (Math.abs(date.diffNow('seconds').seconds) < 60) return 'indicə';
        return date.setLocale('az').toRelative() ?? '';
    }
}
