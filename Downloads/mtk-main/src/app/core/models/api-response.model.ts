export interface ApiResponse<T> {
    data: T;
    message: string;
    statusCode: number;
    status: boolean;
}

export interface PaginatedResponse<T> {
    result: T[];
    count: number;
}

export const TABLE_CONFIG = {
    pagination: {
        defaultPageSize: 25,
        pageSizeOptions: [5, 10, 25, 50, 100],
        defaultPageIndex: 0,
    }
} as const;

export interface PaginationRequest {
    nextPageNumber: number;
    visibleItemCount: number;
    filters?: TableFilter[];
    beginDate?: string;  // ISO date string, optional
    endDate?: string;    // ISO date string, optional
}

export interface TableFilter {
    columnName: string;
    value: string;
}