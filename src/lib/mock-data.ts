// Simple placeholder data layer. Swap these functions for API calls later —
// every page reads data only through the helpers at the bottom of this file.

export type Status = "Active" | "Inactive";

export type Column = { key: string; label: string; sortable?: boolean };

export type Record_ = { id: string; status: Status; [key: string]: string };

export type EntityConfig = {
  slug: string;
  title: string;
  singular: string;
  columns: Column[];
  fields: { key: string; label: string; type?: "text" | "number" | "email" }[];
  rows: Record_[];
};

const provinces: Record_[] = [
  { id: "1", name: "Western", code: "WP", agencies: "12", status: "Active" },
  { id: "2", name: "Central", code: "CP", agencies: "8", status: "Active" },
  { id: "3", name: "Southern", code: "SP", agencies: "9", status: "Active" },
  { id: "4", name: "Northern", code: "NP", agencies: "4", status: "Inactive" },
  { id: "5", name: "Uva", code: "UV", agencies: "3", status: "Active" },
  { id: "6", name: "Sabaragamuwa", code: "SG", agencies: "5", status: "Inactive" },
];

const areaManagers: Record_[] = [
  {
    id: "1",
    name: "N. Fernando",
    email: "n.fernando@sellora.io",
    province: "Western",
    status: "Active",
  },
  {
    id: "2",
    name: "K. Perera",
    email: "k.perera@sellora.io",
    province: "Central",
    status: "Active",
  },
  {
    id: "3",
    name: "S. Jayawardena",
    email: "s.jaya@sellora.io",
    province: "Southern",
    status: "Inactive",
  },
];

const agencies: Record_[] = [
  {
    id: "1",
    name: "Colombo Metro Distributors",
    code: "AG-001",
    province: "Western",
    territories: "6",
    status: "Active",
  },
  {
    id: "2",
    name: "Kandy Trade Partners",
    code: "AG-002",
    province: "Central",
    territories: "4",
    status: "Active",
  },
  {
    id: "3",
    name: "Galle Supply Co.",
    code: "AG-003",
    province: "Southern",
    territories: "3",
    status: "Inactive",
  },
  {
    id: "4",
    name: "Badulla Distributors",
    code: "AG-004",
    province: "Uva",
    territories: "2",
    status: "Active",
  },
];

const territories: Record_[] = [
  {
    id: "1",
    name: "Colombo North",
    code: "T-101",
    agency: "Colombo Metro Distributors",
    shops: "148",
    status: "Active",
  },
  {
    id: "2",
    name: "Colombo South",
    code: "T-102",
    agency: "Colombo Metro Distributors",
    shops: "132",
    status: "Active",
  },
  {
    id: "3",
    name: "Kandy City",
    code: "T-201",
    agency: "Kandy Trade Partners",
    shops: "96",
    status: "Active",
  },
  {
    id: "4",
    name: "Galle Coastal",
    code: "T-301",
    agency: "Galle Supply Co.",
    shops: "74",
    status: "Inactive",
  },
];

const salesReps: Record_[] = [
  {
    id: "1",
    name: "A. Silva",
    code: "SR-014",
    territory: "Colombo North",
    phone: "077 123 4567",
    status: "Active",
  },
  {
    id: "2",
    name: "R. Bandara",
    code: "SR-019",
    territory: "Kandy City",
    phone: "071 998 2210",
    status: "Active",
  },
  {
    id: "3",
    name: "M. Dias",
    code: "SR-022",
    territory: "Galle Coastal",
    phone: "076 442 1180",
    status: "Inactive",
  },
  {
    id: "4",
    name: "T. Rajapaksha",
    code: "SR-027",
    territory: "Colombo South",
    phone: "070 331 8890",
    status: "Active",
  },
];

const shops: Record_[] = [
  {
    id: "1",
    name: "New City Grocery",
    code: "SH-1042",
    territory: "Colombo North",
    owner: "P. Kumara",
    status: "Active",
  },
  {
    id: "2",
    name: "Sunrise Mart",
    code: "SH-1088",
    territory: "Colombo South",
    owner: "L. Nawaz",
    status: "Active",
  },
  {
    id: "3",
    name: "Hill Top Stores",
    code: "SH-2011",
    territory: "Kandy City",
    owner: "D. Herath",
    status: "Inactive",
  },
  {
    id: "4",
    name: "Ocean Traders",
    code: "SH-3005",
    territory: "Galle Coastal",
    owner: "V. Peiris",
    status: "Active",
  },
];

const products: Record_[] = [
  {
    id: "1",
    name: "Cream Cracker 190g",
    sku: "FMCG-0091",
    category: "Biscuits",
    price: "180.00",
    status: "Active",
  },
  {
    id: "2",
    name: "Milk Powder 400g",
    sku: "FMCG-0142",
    category: "Dairy",
    price: "1,290.00",
    status: "Active",
  },
  {
    id: "3",
    name: "Coconut Oil 750ml",
    sku: "FMCG-0233",
    category: "Cooking",
    price: "940.00",
    status: "Inactive",
  },
  {
    id: "4",
    name: "Detergent Bar 120g",
    sku: "FMCG-0310",
    category: "Household",
    price: "125.00",
    status: "Active",
  },
];

const inventory: Record_[] = [
  {
    id: "1",
    product: "Cream Cracker 190g",
    warehouse: "Colombo Main",
    onHand: "4,820",
    reserved: "310",
    status: "Active",
  },
  {
    id: "2",
    product: "Milk Powder 400g",
    warehouse: "Colombo Main",
    onHand: "1,240",
    reserved: "180",
    status: "Active",
  },
  {
    id: "3",
    product: "Coconut Oil 750ml",
    warehouse: "Kandy Depot",
    onHand: "0",
    reserved: "0",
    status: "Inactive",
  },
];

const orders: Record_[] = [
  {
    id: "1",
    reference: "ORD-20481",
    shop: "New City Grocery",
    rep: "A. Silva",
    total: "42,180.00",
    status: "Active",
  },
  {
    id: "2",
    reference: "ORD-20482",
    shop: "Sunrise Mart",
    rep: "T. Rajapaksha",
    total: "18,940.00",
    status: "Active",
  },
  {
    id: "3",
    reference: "ORD-20479",
    shop: "Hill Top Stores",
    rep: "R. Bandara",
    total: "7,320.00",
    status: "Inactive",
  },
];

export const entities: Record<string, EntityConfig> = {
  provinces: {
    slug: "provinces",
    title: "Provinces",
    singular: "Province",
    columns: [
      { key: "name", label: "Name", sortable: true },
      { key: "code", label: "Code", sortable: true },
      { key: "agencies", label: "Agencies", sortable: true },
      { key: "status", label: "Status", sortable: true },
    ],
    fields: [
      { key: "name", label: "Province name" },
      { key: "code", label: "Province code" },
    ],
    rows: provinces,
  },
  "area-managers": {
    slug: "area-managers",
    title: "Area Managers",
    singular: "Area Manager",
    columns: [
      { key: "name", label: "Name", sortable: true },
      { key: "email", label: "Email" },
      { key: "province", label: "Province", sortable: true },
      { key: "status", label: "Status", sortable: true },
    ],
    fields: [
      { key: "name", label: "Full name" },
      { key: "email", label: "Email address", type: "email" },
      { key: "province", label: "Province" },
    ],
    rows: areaManagers,
  },
  agencies: {
    slug: "agencies",
    title: "Agencies",
    singular: "Agency",
    columns: [
      { key: "name", label: "Name", sortable: true },
      { key: "code", label: "Code", sortable: true },
      { key: "province", label: "Province", sortable: true },
      { key: "territories", label: "Territories" },
      { key: "status", label: "Status", sortable: true },
    ],
    fields: [
      { key: "name", label: "Agency name" },
      { key: "code", label: "Agency code" },
      { key: "province", label: "Province" },
    ],
    rows: agencies,
  },
  territories: {
    slug: "territories",
    title: "Territories",
    singular: "Territory",
    columns: [
      { key: "name", label: "Name", sortable: true },
      { key: "code", label: "Code", sortable: true },
      { key: "agency", label: "Agency", sortable: true },
      { key: "shops", label: "Shops" },
      { key: "status", label: "Status", sortable: true },
    ],
    fields: [
      { key: "name", label: "Territory name" },
      { key: "code", label: "Territory code" },
      { key: "agency", label: "Agency" },
    ],
    rows: territories,
  },
  "sales-reps": {
    slug: "sales-reps",
    title: "Sales Reps",
    singular: "Sales Rep",
    columns: [
      { key: "name", label: "Name", sortable: true },
      { key: "code", label: "Rep code", sortable: true },
      { key: "territory", label: "Territory", sortable: true },
      { key: "phone", label: "Phone" },
      { key: "status", label: "Status", sortable: true },
    ],
    fields: [
      { key: "name", label: "Full name" },
      { key: "code", label: "Rep code" },
      { key: "territory", label: "Territory" },
      { key: "phone", label: "Phone number" },
    ],
    rows: salesReps,
  },
  shops: {
    slug: "shops",
    title: "Shops",
    singular: "Shop",
    columns: [
      { key: "name", label: "Name", sortable: true },
      { key: "code", label: "Shop code", sortable: true },
      { key: "territory", label: "Territory", sortable: true },
      { key: "owner", label: "Owner" },
      { key: "status", label: "Status", sortable: true },
    ],
    fields: [
      { key: "name", label: "Shop name" },
      { key: "code", label: "Shop code" },
      { key: "territory", label: "Territory" },
      { key: "owner", label: "Owner name" },
    ],
    rows: shops,
  },
  products: {
    slug: "products",
    title: "Products",
    singular: "Product",
    columns: [
      { key: "name", label: "Name", sortable: true },
      { key: "sku", label: "SKU", sortable: true },
      { key: "category", label: "Category", sortable: true },
      { key: "price", label: "Unit price" },
      { key: "status", label: "Status", sortable: true },
    ],
    fields: [
      { key: "name", label: "Product name" },
      { key: "sku", label: "SKU" },
      { key: "category", label: "Category" },
      { key: "price", label: "Unit price", type: "number" },
    ],
    rows: products,
  },
  inventory: {
    slug: "inventory",
    title: "Inventory",
    singular: "Stock Record",
    columns: [
      { key: "product", label: "Product", sortable: true },
      { key: "warehouse", label: "Warehouse", sortable: true },
      { key: "onHand", label: "On hand" },
      { key: "reserved", label: "Reserved" },
      { key: "status", label: "Status", sortable: true },
    ],
    fields: [
      { key: "product", label: "Product" },
      { key: "warehouse", label: "Warehouse" },
      { key: "onHand", label: "Quantity on hand", type: "number" },
    ],
    rows: inventory,
  },
  orders: {
    slug: "orders",
    title: "Orders",
    singular: "Order",
    columns: [
      { key: "reference", label: "Reference", sortable: true },
      { key: "shop", label: "Shop", sortable: true },
      { key: "rep", label: "Sales rep", sortable: true },
      { key: "total", label: "Total" },
      { key: "status", label: "Status", sortable: true },
    ],
    fields: [
      { key: "reference", label: "Order reference" },
      { key: "shop", label: "Shop" },
      { key: "rep", label: "Sales rep" },
    ],
    rows: orders,
  },
};

export function getEntity(slug: string): EntityConfig | undefined {
  return entities[slug];
}

export function getRecord(slug: string, id: string): Record_ | undefined {
  return entities[slug]?.rows.find((r) => r.id === id);
}

export const summaryStats = [
  { label: "Agencies", value: "38" },
  { label: "Territories", value: "164" },
  { label: "Shops", value: "12,480" },
  { label: "Active reps", value: "212" },
];

export const recentActivity = [
  {
    id: "1",
    text: "A. Silva submitted order ORD-20481 for New City Grocery",
    time: "12 minutes ago",
  },
  { id: "2", text: "Territory Colombo South reassigned to T. Rajapaksha", time: "1 hour ago" },
  { id: "3", text: "Product Coconut Oil 750ml marked inactive", time: "3 hours ago" },
  { id: "4", text: "Agency Badulla Distributors created", time: "Yesterday" },
  { id: "5", text: "Shop Ocean Traders updated by K. Perera", time: "Yesterday" },
];

export const currentUser = { name: "Placeholder User", role: "Administrator" };
