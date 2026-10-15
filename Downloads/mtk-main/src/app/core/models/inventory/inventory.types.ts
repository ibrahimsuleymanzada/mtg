export interface InventoryListItem {
    id:            number;
    name:          string;
    category:      string;
    quantity:      number;
    unit:          string;
    status:        string;
    location:      string;
    purchaseDate:  string;
    purchasePrice: number;
    notes:         string | null;
}

export interface Inventory {
    id:            number;
    name:          string;
    category:      string;
    quantity:      number;
    unit:          string;
    status:        string;
    location:      string;
    purchaseDate:  string;
    purchasePrice: number;
    notes:         string | null;
}

export interface InventoryFormData {
    id:            number;
    complexId:     number;
    name:          string;
    category:      string;
    quantity:      number;
    unit:          string;
    status:        string;
    location:      string;
    purchaseDate:  string;
    purchasePrice: number;
    notes:         string | null;
}
