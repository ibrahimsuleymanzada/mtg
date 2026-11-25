import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { FeedUploadEvent, FeedService, insertAfterPinned, sortFeedPosts } from './feed.service';
import { FeedPost } from '../../models/resident/feed.types';

const post = (id: number, pinned = false): FeedPost => ({
    id, author: 'A', initials: 'A', official: false, mine: false, pinned,
    createdAt: new Date().toISOString(), audience: 'all', text: `post ${id}`, likes: 0, comments: [], liked: false,
});

describe('feed ordering helpers', () => {
    it('sortFeedPosts moves pinned posts first and keeps the order inside each group', () => {
        const sorted = sortFeedPosts([post(1), post(2, true), post(3), post(4, true)]);
        expect(sorted.map(p => p.id)).toEqual([2, 4, 1, 3]);
    });

    it('insertAfterPinned puts a new post right below the pinned ones', () => {
        const list = [post(1, true), post(2, true), post(3), post(4)];
        expect(insertAfterPinned(list, post(9)).map(p => p.id)).toEqual([1, 2, 9, 3, 4]);
    });

    it('insertAfterPinned works with nothing pinned, only pinned, and an empty list', () => {
        expect(insertAfterPinned([post(1), post(2)], post(9)).map(p => p.id)).toEqual([9, 1, 2]);
        expect(insertAfterPinned([post(1, true)], post(9)).map(p => p.id)).toEqual([1, 9]);
        expect(insertAfterPinned([], post(9)).map(p => p.id)).toEqual([9]);
    });
});

describe('FeedService (mock mode)', () => {
    let service: FeedService;

    beforeEach(() => {
        TestBed.configureTestingModule({ providers: [provideHttpClient()] });
        service = TestBed.inject(FeedService);
    });

    /** Runs a mock call to completion and returns everything it emitted. */
    const collect = <T>(source: { subscribe: (o: (v: T) => void) => unknown }): T[] => {
        const out: T[] = [];
        source.subscribe(v => out.push(v));
        tick(10_000);               // the mock answers after a simulated delay
        return out;
    };

    it('paginates: 5 per page, pinned first, total count reported', fakeAsync(() => {
        const [p1] = collect(service.getPosts(1, 5));
        const [p3] = collect(service.getPosts(3, 5));

        expect(p1.data.count).toBe(11);
        expect(p1.data.result.length).toBe(5);
        expect(p1.data.result[0].pinned).toBeTrue();
        expect(p3.data.result.length).toBe(1);
    }));

    it('createPost without files finishes with a single done event and the post becomes visible', fakeAsync(() => {
        const events = collect<FeedUploadEvent>(service.createPost({ text: 'Salam', audience: 'all' }));
        expect(events.length).toBe(1);
        expect(events[0].kind).toBe('done');

        const [page] = collect(service.getPosts(1, 20));
        const created = page.data.result.find(p => p.text === 'Salam');
        expect(created?.mine).toBeTrue();
        expect(page.data.result.indexOf(created!)).toBe(1);    // right below the pinned post
    }));

    it('createPost with files reports growing progress, then done', fakeAsync(() => {
        const file = new File([new Uint8Array(10)], 'a.png', { type: 'image/png' });
        const events = collect<FeedUploadEvent>(service.createPost({ text: 'x', audience: 'all', files: [file] }));

        const percents = events.filter(e => e.kind === 'progress').map(e => (e as { percent: number }).percent);
        expect(percents.length).toBeGreaterThan(3);
        expect(percents).toEqual([...percents].sort((a, b) => a - b));
        expect(Math.max(...percents)).toBeLessThan(100);       // 100% is reported by the final `done`
        expect(events[events.length - 1].kind).toBe('done');
    }));

    it('cancelling an upload (unsubscribe) creates nothing', fakeAsync(() => {
        const file = new File([new Uint8Array(10)], 'a.png', { type: 'image/png' });
        const sub = service.createPost({ text: 'cancelled', audience: 'all', files: [file] }).subscribe();
        tick(300);
        sub.unsubscribe();
        tick(10_000);

        const [page] = collect(service.getPosts(1, 20));
        expect(page.data.result.some(p => p.text === 'cancelled')).toBeFalse();
    }));

    it('toggleLike flips the state and keeps the counter consistent', fakeAsync(() => {
        const [first] = collect(service.toggleLike(1));
        const [second] = collect(service.toggleLike(1));

        expect(first.data).toEqual({ id: 1, liked: true, likes: 25 });
        expect(second.data).toEqual({ id: 1, liked: false, likes: 24 });
    }));

    it('comments: add, edit (author only) and delete', fakeAsync(() => {
        const [added] = collect(service.addComment({ postId: 3, text: 'hello' }));
        expect(added.status).toBeTrue();
        const commentId = added.data.id;

        const [edited] = collect(service.updateComment({ postId: 3, commentId, text: 'hello!' }));
        expect(edited.data.text).toBe('hello!');
        expect(edited.data.edited).toBeTrue();

        const [foreign] = collect(service.updateComment({ postId: 1, commentId: 101, text: 'hack' }));
        expect(foreign.status).toBeFalse();                    // someone else's comment

        const [deleted] = collect(service.deleteComment(3, commentId));
        expect(deleted.status).toBeTrue();
        const [post] = collect(service.getPostById(3));
        expect(post.data.comments.length).toBe(0);
    }));

    it('getPostById answers with status=false for an unknown post', fakeAsync(() => {
        const [res] = collect(service.getPostById(999999));
        expect(res.status).toBeFalse();
    }));
});
