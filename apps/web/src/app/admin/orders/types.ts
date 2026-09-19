import type { Order } from '@hh/db';

export type TabKey = 'all' | 'to_pack' | 'processing' | 'shipped';

export interface AdminOrderItem extends Order {
  itemCount: number;
}

export interface OrdersTableProps {
  initialOrders: AdminOrderItem[];
}
