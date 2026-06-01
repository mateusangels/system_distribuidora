export type Role = 'admin' | 'caixa';

export interface User {
    id: number;
    name: string;
    email: string;
    role: Role;
    is_admin: boolean;
    avatar_url?: string | null;
    email_verified_at?: string | null;
}

export interface Category {
    id: number;
    name: string;
}

export interface Product {
    id: number;
    sku: string;
    barcode: string | null;
    name: string;
    description: string | null;
    category_id: number | null;
    category?: Category | null;
    cost_price: string;
    sale_price: string;
    stock_qty: number;
    min_stock_qty: number;
    warranty_days: number;
    active: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface Customer {
    id: number;
    name: string;
    document: string | null;
    phone: string | null;
    whatsapp: string | null;
    email: string | null;
    address: string | null;
    notes: string | null;
    credit_limit?: string | number;
}

export type PaymentMethod = 'cash' | 'pix' | 'credit' | 'debit' | 'fiado';
export type SaleStatus = 'open' | 'paid' | 'pending' | 'cancelled';

export interface SaleItem {
    id: number;
    sale_id: number;
    product_id: number;
    product_name: string;
    product_sku: string;
    qty: number;
    unit_price: string;
    total: string;
    warranty_days: number;
}

export interface Sale {
    id: number;
    code: string;
    user_id: number;
    customer_id: number | null;
    customer_document: string | null;
    subtotal: string;
    discount: string;
    total: string;
    payment_method: PaymentMethod;
    amount_received: string | null;
    change_due: string | null;
    status: SaleStatus;
    paid_at: string | null;
    due_date: string | null;
    amount_paid: string;
    notes: string | null;
    created_at?: string;
    items?: SaleItem[];
    customer?: Customer | null;
    user?: User;
    payments?: Payment[];
}

export type PaymentReceiptMethod = 'cash' | 'pix' | 'credit' | 'debit' | 'other';

export interface Payment {
    id: number;
    code: string;
    customer_id: number;
    sale_id: number | null;
    user_id: number;
    amount: string;
    method: PaymentReceiptMethod;
    paid_at: string;
    notes: string | null;
    customer?: Pick<Customer, 'id' | 'name'> | null;
    user?: Pick<User, 'id' | 'name'>;
}

export interface Alerts {
    low_stock: number;
    fiado_overdue: number;
}

export interface Paginated<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
    next_page_url: string | null;
    prev_page_url: string | null;
}

export type PageProps<
    T extends Record<string, unknown> = Record<string, unknown>,
> = T & {
    auth: { user: User };
    store: { name: string; tagline: string };
    alerts: Alerts;
    flash: { success: string | null; error: string | null };
};
