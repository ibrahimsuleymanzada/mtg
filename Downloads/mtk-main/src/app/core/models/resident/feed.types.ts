export interface FeedComment {
    id:        number;
    author:    string;
    initials:  string;
    text:      string;
    createdAt: string;      // ISO date string
    mine:      boolean;
}

export interface FeedCommentFormData {
    postId: number;
    text:   string;
}

export interface FeedPost {
    id:            number;
    author:        string;
    initials:      string;
    official:      boolean;
    mine:          boolean;
    pinned:        boolean;
    createdAt:     string;      // ISO date string
    audience:      string;
    text:          string;
    imageCaption?: string;
    likes:         number;
    comments:      FeedComment[];
    liked:         boolean;
}

export interface FeedPostFormData {
    text:     string;
    audience: string;
}

export interface FeedPinData {
    id:     number;
    pinned: boolean;
}

export interface FeedLikeResult {
    id:    number;
    liked: boolean;
    likes: number;
}
