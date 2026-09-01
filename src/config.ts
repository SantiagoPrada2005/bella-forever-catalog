export interface AppConfig {
  brandName: string;
  instagramUser: string;
  whatsappNumber: string;
  defaultCity: string;
  currency: {
    symbol: string;
    code: string;
    locale: string;
    precision: number;
  };
  categories: Array<{ id: string; name: string }>;
}

export const CONFIG: AppConfig = {
  brandName: "Bella Forever",
  instagramUser: "bellaforeverbeauty",
  whatsappNumber: "+573117887806",
  defaultCity: "Roldanillo",
  currency: {
    symbol: "$",
    code: "COP",
    locale: "es-CO",
    precision: 0,
  },
  categories: [
    { id: "todos", name: "Todos" },
    { id: "rubor", name: "Rubor" },
    { id: "labiales", name: "Labiales" },
    { id: "cejas", name: "Cejas" },
    { id: "pestanas", name: "Pestañas" },
    { id: "correctores", name: "Correctores" },
  ],
};
