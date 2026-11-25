import { TestBed } from '@angular/core/testing';
import { FeedPreferencesService } from './feed-preferences.service';

describe('FeedPreferencesService', () => {
    let service: FeedPreferencesService;

    beforeEach(() => {
        localStorage.removeItem('cityhub.feed.skipDeleteConfirm');
        localStorage.removeItem('cityhub.feed.draft');
        TestBed.configureTestingModule({});
        service = TestBed.inject(FeedPreferencesService);
    });

    it('remembers "don\'t ask again" and can restore the confirmation', () => {
        expect(service.skipDeleteConfirm).toBeFalse();
        service.skipDeleteConfirm = true;
        expect(service.skipDeleteConfirm).toBeTrue();
        expect(localStorage.getItem('cityhub.feed.skipDeleteConfirm')).toBe('1');

        service.skipDeleteConfirm = false;
        expect(service.skipDeleteConfirm).toBeFalse();
        expect(localStorage.getItem('cityhub.feed.skipDeleteConfirm')).toBeNull();
    });

    it('stores the draft and removes the key when it is emptied', () => {
        service.draft = 'Salam';
        expect(service.draft).toBe('Salam');
        service.draft = '';
        expect(localStorage.getItem('cityhub.feed.draft')).toBeNull();
        expect(service.draft).toBe('');
    });

    it('never throws when localStorage is unavailable', () => {
        spyOn(Storage.prototype, 'getItem').and.throwError('blocked');
        spyOn(Storage.prototype, 'setItem').and.throwError('blocked');
        spyOn(Storage.prototype, 'removeItem').and.throwError('blocked');

        expect(service.skipDeleteConfirm).toBeFalse();
        expect(service.draft).toBe('');
        expect(() => { service.skipDeleteConfirm = true; service.draft = 'x'; service.draft = ''; }).not.toThrow();
    });
});
