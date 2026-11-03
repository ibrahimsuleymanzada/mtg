import { Injectable } from '@angular/core';
import { Observable, delay, of } from 'rxjs';
import { BaseApiService } from '../base-api.service';
import { ApiResponse, PaginatedResponse } from '../../models/api-response.model';
import {
    FeedComment, FeedCommentFormData, FeedCommentUpdateData, FeedLikeResult, FeedMedia,
    FeedPinData, FeedPost, FeedPostFormData, FeedPostUpdateData,
} from '../../models/resident/feed.types';

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

    // ── Posts ───────────────────────────────────────────────────────────

    /** Page numbers start at 1. `count` in the response is the total number of posts. */
    getPosts(page: number, pageSize: number): Observable<ApiResponse<PaginatedResponse<FeedPost>>> {
        if (this.useMock) {
            const sorted = sortFeedPosts(this.mockPosts);
            const result = sorted.slice((page - 1) * pageSize, page * pageSize).map(p => ({ ...p }));
            return this.mockResponse({ result, count: sorted.length });
        }

        const request: any = {
            currentPageName:  'feed',
            nextPageNumber:   page,
            visibleItemCount: pageSize,
            filters:          [],
            exportToExcel:    false,
        };
        return this.getList<FeedPost>('Resident/GetFeedPosts', request);
    }

    createPost(data: FeedPostFormData): Observable<ApiResponse<FeedPost>> {
        const files = data.files ?? [];

        if (this.useMock) {
            const media: FeedMedia[] = files.map(file => ({
                type: file.type.startsWith('video/') ? 'video' : 'image',
                url:  URL.createObjectURL(file),
                name: file.name,
            }));
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
                media,
                likes:     0,
                comments:  [],
                liked:     false,
            };
            this.mockPosts = [post, ...this.mockPosts];
            return this.mockResponse({ ...post });
        }

        const body = { text: data.text, audience: data.audience };
        return files.length
            ? this.saveMultipart<FeedPost>('Resident/SaveFeedPost', body, files)
            : this.save<FeedPost>('Resident/SaveFeedPost', body);
    }

    /** Only the author may edit a post; the backend must enforce this too. */
    updatePost(data: FeedPostUpdateData): Observable<ApiResponse<FeedPost>> {
        if (this.useMock) {
            const post = this.mockPosts.find(p => p.id === data.id);
            if (!post || !post.mine) {
                return this.mockError<FeedPost>('Paylaşımı redaktə etmək mümkün deyil', 403);
            }
            const updated: FeedPost = { ...post, text: data.text, edited: true };
            this.mockPosts = this.mockPosts.map(p => (p.id === data.id ? updated : p));
            return this.mockResponse({ ...updated });
        }

        return this.save<FeedPost>('Resident/UpdateFeedPost', data);
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
                return this.mockError<FeedLikeResult>('Paylaşım tapılmadı', 404);
            }
            const liked = !post.liked;
            const updated = { ...post, liked, likes: Math.max(0, post.likes + (liked ? 1 : -1)) };
            this.mockPosts = this.mockPosts.map(p => (p.id === id ? updated : p));
            return this.mockResponse({ id, liked: updated.liked, likes: updated.likes });
        }

        return this.save<FeedLikeResult>('Resident/ToggleFeedPostLike', { id });
    }

    // ── Comments ────────────────────────────────────────────────────────

    addComment(data: FeedCommentFormData): Observable<ApiResponse<FeedComment>> {
        if (this.useMock) {
            const post = this.mockPosts.find(p => p.id === data.postId);
            if (!post) {
                return this.mockError<FeedComment>('Paylaşım tapılmadı', 404);
            }
            const comment: FeedComment = {
                id:        Date.now(),
                author:    this.mockUser.name,
                initials:  this.mockUser.initials,
                text:      data.text,
                createdAt: new Date().toISOString(),
                mine:      true,
            };
            this.patchMockComments(data.postId, comments => [...comments, comment]);
            return this.mockResponse({ ...comment });
        }

        return this.save<FeedComment>('Resident/AddFeedPostComment', data);
    }

    /** Only the author may edit a comment; the backend must enforce this too. */
    updateComment(data: FeedCommentUpdateData): Observable<ApiResponse<FeedComment>> {
        if (this.useMock) {
            const comment = this.mockPosts.find(p => p.id === data.postId)?.comments.find(c => c.id === data.commentId);
            if (!comment || !comment.mine) {
                return this.mockError<FeedComment>('Şərhi redaktə etmək mümkün deyil', 403);
            }
            const updated: FeedComment = { ...comment, text: data.text, edited: true };
            this.patchMockComments(data.postId, comments => comments.map(c => (c.id === data.commentId ? updated : c)));
            return this.mockResponse({ ...updated });
        }

        return this.save<FeedComment>('Resident/UpdateFeedPostComment', data);
    }

    /**
     * The author or an admin may delete a comment. The backend decides who is allowed;
     * the mock accepts any existing comment.
     */
    deleteComment(postId: number, commentId: number): Observable<ApiResponse<any>> {
        if (this.useMock) {
            const exists = this.mockPosts.find(p => p.id === postId)?.comments.some(c => c.id === commentId);
            if (!exists) {
                return this.mockError<any>('Şərh tapılmadı', 404);
            }
            this.patchMockComments(postId, comments => comments.filter(c => c.id !== commentId));
            return this.mockResponse(null);
        }

        return this.delete<any>('Resident/DeleteFeedPostComment', commentId);
    }

    // ── Mock helpers ────────────────────────────────────────────────────

    private mockResponse<T>(data: T): Observable<ApiResponse<T>> {
        return of<ApiResponse<T>>({ data, message: '', statusCode: 200, status: true }).pipe(delay(250));
    }

    private mockError<T>(message: string, statusCode: number): Observable<ApiResponse<T>> {
        return of<ApiResponse<T>>({ data: null as any, message, statusCode, status: false }).pipe(delay(250));
    }

    private patchMockComments(postId: number, fn: (comments: FeedComment[]) => FeedComment[]): void {
        this.mockPosts = this.mockPosts.map(p => (p.id === postId ? { ...p, comments: fn(p.comments) } : p));
    }

    private buildMockPosts(): FeedPost[] {
        const ago = (hours: number): string => new Date(Date.now() - hours * 3_600_000).toISOString();

        const older: [string, string, string, number, boolean][] = [
            ['Rəşad Quliyev',   'RQ', 'Zirzəmidəki dayanacaqda 14 nömrəli yerə kimsə maşın qoyub, sahibi xahiş olunur çıxarsın.', 96, false],
            ['Nigar Əliyeva',   'NƏ', 'Uşaq meydançasındakı yellənçək təmir olunub, çox sağ olun idarəyə!', 120, false],
            [this.mockUser.name, this.mockUser.initials, 'Kim C blokunda mənzil icarəyə verən tanıyır? Qohumum üçün axtarırıq.', 144, true],
            ['Elnur Məmmədov',  'EM', 'Axşam saat 23:00-dan sonra 5-ci mərtəbədə yüksək səs gəlir, xahiş edirik nəzərə alın.', 170, false],
            ['Leyla Hüseynova', 'LH', 'Zibil qutuları yenidən yerləşdirilib, indi həyətin sonundadır.', 200, false],
            ['Tural Əhmədov',   'TƏ', 'Pulsuz uşaq geyimləri paylayıram, mühafizə postunda paketlər var.', 230, false],
            [this.mockUser.name, this.mockUser.initials, 'Həyətdəki işıqlandırma lampalarından ikisi yanmır, idarəyə müraciət göndərdim.', 260, true],
            ['Sevda Rzayeva',   'SR', 'Dünən axşam giriş qapısının domofonu işləmirdi, indi düzəlib?', 300, false],
        ];

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
                    { id: 105, author: this.mockUser.name, initials: this.mockUser.initials, text: 'Sahibi axtarılır, mühafizədən soruşun.', createdAt: ago(18), mine: true },
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
            ...older.map(([author, initials, text, hours, mine], i): FeedPost => ({
                id: 10 + i,
                author,
                initials,
                official: false,
                mine,
                pinned: false,
                createdAt: ago(hours),
                audience: 'Bütün sakinlər',
                text,
                likes: (i * 3) % 11,
                comments: [],
                liked: false,
            })),
        ];
    }
}
