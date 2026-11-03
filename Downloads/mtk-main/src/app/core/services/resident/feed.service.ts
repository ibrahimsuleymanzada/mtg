import { Injectable } from '@angular/core';
import { Observable, delay, of } from 'rxjs';
import { BaseApiService } from '../base-api.service';
import { ApiResponse, PaginatedResponse } from '../../models/api-response.model';
import { FeedComment, FeedCommentFormData, FeedLikeResult, FeedPinData, FeedPost, FeedPostFormData } from '../../models/resident/feed.types';

/**
 * Pinned posts always stay on top; the original order is preserved inside each group
 * (Array.prototype.sort is stable), so new posts land right below the pinned ones.
 */
export function sortFeedPosts(posts: FeedPost[]): FeedPost[] {
    return [...posts].sort((a, b) => Number(b.pinned) - Number(a.pinned));
}

/**
 * Inserts a new post right after the last pinned one (or at the very top if nothing is pinned).
 */
export function insertAfterPinned(posts: FeedPost[], post: FeedPost): FeedPost[] {
    const firstUnpinned = posts.findIndex(p => !p.pinned);
    const index = firstUnpinned === -1 ? posts.length : firstUnpinned;
    return [...posts.slice(0, index), post, ...posts.slice(index)];
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
                comments:  [],
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

    /** Likes the post if it is not liked yet, removes the like otherwise. */
    toggleLike(id: number): Observable<ApiResponse<FeedLikeResult>> {
        if (this.useMock) {
            const post = this.mockPosts.find(p => p.id === id);
            if (!post) {
                return of<ApiResponse<FeedLikeResult>>({
                    data: null as any, message: 'Paylaşım tapılmadı', statusCode: 404, status: false,
                }).pipe(delay(250));
            }
            const liked = !post.liked;
            const updated = { ...post, liked, likes: Math.max(0, post.likes + (liked ? 1 : -1)) };
            this.mockPosts = this.mockPosts.map(p => (p.id === id ? updated : p));
            return this.mockResponse({ id, liked: updated.liked, likes: updated.likes });
        }

        return this.save<FeedLikeResult>('Resident/ToggleFeedPostLike', { id });
    }

    addComment(data: FeedCommentFormData): Observable<ApiResponse<FeedComment>> {
        if (this.useMock) {
            const post = this.mockPosts.find(p => p.id === data.postId);
            if (!post) {
                return of<ApiResponse<FeedComment>>({
                    data: null as any, message: 'Paylaşım tapılmadı', statusCode: 404, status: false,
                }).pipe(delay(250));
            }
            const comment: FeedComment = {
                id:        Date.now(),
                author:    this.mockUser.name,
                initials:  this.mockUser.initials,
                text:      data.text,
                createdAt: new Date().toISOString(),
                mine:      true,
            };
            this.mockPosts = this.mockPosts.map(p =>
                p.id === data.postId ? { ...p, comments: [...p.comments, comment] } : p);
            return this.mockResponse({ ...comment });
        }

        return this.save<FeedComment>('Resident/AddFeedPostComment', data);
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
                comments: [
                    { id: 101, author: 'Aygün Həsənova', initials: 'AH', text: 'Təşəkkürlər, xəbərdarlıq üçün!', createdAt: ago(1.5), mine: false },
                    { id: 102, author: 'Rəşad Quliyev', initials: 'RQ', text: 'Lift neçə saat işləməyəcək? Uşaq arabası ilə çətin olacaq.', createdAt: ago(1), mine: false },
                    { id: 103, author: 'MTK İdarəsi — Şirkət 4', initials: 'MT', text: 'Rəşad bəy, işlər 14:00-dək başa çatacaq, A blokunun lifti işləyəcək.', createdAt: ago(0.5), mine: false },
                ],
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
                comments: [
                    { id: 104, author: 'Nigar Əliyeva', initials: 'NƏ', text: 'Bizim uşaq tapıb gətirmişdi, sahibi tapıldımı?', createdAt: ago(20), mine: false },
                ],
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
                comments: [],
                liked: false,
            },
        ];
    }
}
