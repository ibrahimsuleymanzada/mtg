import { Injectable } from '@angular/core';
import { Observable, delay, of } from 'rxjs';
import { BaseApiService } from '../base-api.service';
import { ApiResponse, PaginatedResponse } from '../../models/api-response.model';
import { FeedPinData, FeedPost, FeedPostFormData } from '../../models/resident/feed.types';

/**
 * Pinned posts always stay on top; the original order is preserved inside each group
 * (Array.prototype.sort is stable), so new posts land right below the pinned ones.
 */
export function sortFeedPosts(posts: FeedPost[]): FeedPost[] {
    return [...posts].sort((a, b) => Number(b.pinned) - Number(a.pinned));
}

@Injectable({ providedIn: 'root' })
export class FeedService extends BaseApiService {

    /**
     * TODO: set to false once the backend endpoints below exist.
     * While true, every method is served from the in-memory store and no HTTP request is made.
     */
    private readonly useMock: boolean = true;

    private readonly mockUser = { name: 'İbrahim Süleymanzadə', initials: 'is' };
    private mockPosts: FeedPost[] = this.buildMockPosts();

    // ── API ─────────────────────────────────────────────────────────────

    getPosts(): Observable<ApiResponse<PaginatedResponse<FeedPost>>> {
        if (this.useMock) {
            const result = this.mockPosts.map(p => ({ ...p }));
            return this.mockResponse({ result, count: result.length });
        }

        const request: any = {
            currentPageName:  'feed',
            nextPageNumber:   1,
            visibleItemCount: 100,
            filters:          [],
            exportToExcel:    false,
        };
        return this.getList<FeedPost>('Resident/GetFeedPosts', request);
    }

    createPost(data: FeedPostFormData): Observable<ApiResponse<FeedPost>> {
        if (this.useMock) {
            const post: FeedPost = {
                id:        Date.now(),
                author:    this.mockUser.name,
                initials:  this.mockUser.initials,
                official:  false,
                mine:      true,
                pinned:    false,
                createdAt: new Date().toISOString(),
                audience:  data.audience,
                text:      data.text,
                likes:     0,
                comments:  0,
                liked:     false,
            };
            this.mockPosts = [post, ...this.mockPosts];
            return this.mockResponse({ ...post });
        }

        return this.save<FeedPost>('Resident/SaveFeedPost', data);
    }

    deletePost(id: number): Observable<ApiResponse<any>> {
        if (this.useMock) {
            this.mockPosts = this.mockPosts.filter(p => p.id !== id);
            return this.mockResponse(null);
        }

        return this.delete<any>('Resident/DeleteFeedPost', id);
    }

    setPinned(id: number, pinned: boolean): Observable<ApiResponse<FeedPost>> {
        if (this.useMock) {
            this.mockPosts = this.mockPosts.map(p => (p.id === id ? { ...p, pinned } : p));
            return this.mockResponse({ ...this.mockPosts.find(p => p.id === id)! });
        }

        const data: FeedPinData = { id, pinned };
        return this.save<FeedPost>('Resident/PinFeedPost', data);
    }

    // ── Mock helpers ────────────────────────────────────────────────────

    private mockResponse<T>(data: T): Observable<ApiResponse<T>> {
        return of<ApiResponse<T>>({ data, message: '', statusCode: 200, status: true }).pipe(delay(250));
    }

    private buildMockPosts(): FeedPost[] {
        const ago = (hours: number): string => new Date(Date.now() - hours * 3_600_000).toISOString();

        return [
            {
                id: 1,
                author: 'MTK İdarəsi — Şirkət 4',
                initials: 'MT',
                official: true,
                mine: false,
                pinned: true,
                createdAt: ago(2),
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
                createdAt: ago(26),
                audience: 'Mənim blokum',
                text: 'Salam, qonşular! Həyətdə tapılmış qırmızı velosipedin sahibini axtarırıq. Mühafizə postunda saxlanılır.',
                likes: 8,
                comments: 2,
                liked: true,
            },
            {
                id: 3,
                author: this.mockUser.name,
                initials: this.mockUser.initials,
                official: false,
                mine: true,
                pinned: false,
                createdAt: ago(72),
                audience: 'Bütün sakinlər',
                text: 'Şənbə günü saat 11:00-da uşaq meydançasında təmizlik aksiyası keçiriləcək. Hamını gözləyirik!',
                likes: 15,
                comments: 4,
                liked: false,
            },
        ];
    }
}
