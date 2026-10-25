export interface AnalyticsProduct {
  id: string;
  name: string;
  price: number;
  category: string;
  tone?: string | null;
  quantity?: number;
}

export interface AnalyticsCustomer {
  name?: string;
  phone?: string;
  email?: string;
  city?: string;
  address?: string;
}

export type AnalyticsEvent =
  | {
      name: 'page_view';
      path?: string;
      title?: string;
    }
  | {
      name: 'view_item';
      product: AnalyticsProduct;
    }
  | {
      name: 'add_to_cart';
      product: AnalyticsProduct;
    }
  | {
      name: 'initiate_checkout';
      items: AnalyticsProduct[];
      total: number;
    }
  | {
      name: 'purchase';
      orderId: string;
      orderNumber: string;
      total: number;
      items: AnalyticsProduct[];
      customer?: AnalyticsCustomer;
    }
  | {
      name: 'contact_whatsapp';
      source: 'header' | 'hero' | 'cart' | 'product_modal' | 'floating_button';
      productName?: string;
    };
