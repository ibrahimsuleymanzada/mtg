import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';

type FeedFilter = 'all' | 'official' | 'mine';

interface FeedPost {
    id: number;
    author: string;
    initials: string;
    official: boolean;
    mine: boolean;
    pinned: boolean;
    time: string;
    audience: string;
    text: string;
    imageCaption?: string;
    likes: number;
    comments: number;
    liked: boolean;
}

@Component({
    selector        : 'resident-feed',
    templateUrl     : './feed.component.html',
    styleUrls       : ['./feed.component.scss'],
    encapsulation   : ViewEncapsulation.None,
    changeDetection : ChangeDetectionStrategy.OnPush,
    standalone      : true,
    imports         : [CommonModule, FormsModule, MatButtonModule, MatIconModule, MatMenuModule],
})
export class ResidentFeedComponent {
    readonly currentUser = { name: 'İbrahim Süleymanzadə', initials: 'is' };

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

    posts: FeedPost[] = [
        {
            id: 1,
            author: 'MTK İdarəsi — Şirkət 4',
            initials: 'MT',
            official: true,
            mine: false,
            pinned: true,
            time: '2 saat əvvəl',
            audience: 'Bütün sakinlər',
            text: 'Hörmətli sakinlər! 15 oktyabr, çərşənbə axşamı 10:00–14:00 arası B blokunda lift profilaktikası aparılacaq. Narahatlığa görə üzr istəyirik. Suallar üçün Müraciətlər bölməsindən yazın.',
            imageCaption: 'B bloku · lift şaxtası',
            likes: 24,
            comments: 6,
            liked: false,
        },
        {
            id: 2,
            author: 'Aygün Həsənova',
            initials: 'AH',
            official: false,
            mine: false,
            pinned: false,
            time: 'dünən',
            audience: 'Mənim blokum',
            text: 'Salam, qonşular! Həyətdə tapılmış qırmızı velosipedin sahibini axtarırıq. Mühafizə postunda saxlanılır.',
            likes: 8,
            comments: 2,
            liked: true,
        },
        {
            id: 3,
            author: 'İbrahim Süleymanzadə',
            initials: 'is',
            official: false,
            mine: true,
            pinned: false,
            time: '3 gün əvvəl',
            audience: 'Bütün sakinlər',
            text: 'Şənbə günü saat 11:00-da uşaq meydançasında təmizlik aksiyası keçiriləcək. Hamını gözləyirik!',
            likes: 15,
            comments: 4,
            liked: false,
        },
    ];

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

    toggleLike(post: FeedPost): void {
        post.liked = !post.liked;
        post.likes += post.liked ? 1 : -1;
    }

    publish(): void {
        const text = this.draft.trim();
        if (!text) return;
        this.posts = [{
            id: Date.now(),
            author: this.currentUser.name,
            initials: this.currentUser.initials,
            official: false,
            mine: true,
            pinned: false,
            time: 'indicə',
            audience: this.audience,
            text,
            likes: 0,
            comments: 0,
            liked: false,
        }, ...this.posts];
        this.draft = '';
    }
}
