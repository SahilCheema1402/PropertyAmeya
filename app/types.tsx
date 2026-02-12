export interface InventoryFormProps {
    inventoryFormData?: any;
    type_?: string;
    setInventoryFormData?: (data: any) => void;
    setPop: (show: boolean) => void;
}

export type InventoryType = 'rent' | 'residential' | 'commercial';

export interface OptionConfig {
    projects: string[];
    bhk: string[];
}