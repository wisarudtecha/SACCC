// src/cms/components/crm/request/inventoryRequestComponet.tsx
import React, { useMemo, useState, useEffect } from 'react';

import Button from '@/core/components/ui/button/Button';
import Input from '@/core/components/form/input/InputField';
import Loading from '@/core/components/common/Loading';
import { Pagination } from '@/core/components/crud/Pagination';
import { useTranslation } from '@/core/hooks/useTranslation';
import { ListIcon, GridIcon, FileXIcon, ShoppingCartIcon, ArrowBigRight, Package, Wrench } from 'lucide-react';
import { CloseIcon } from '@/core/icons';
import ConfirmModal from '@/cms/components/crm/ConfirmModal';
import { usePermissions, useToast } from '@/core/hooks';

import { useReadBrandQuery } from '@/cms/store/api/brandApi';
import { useReadProductQuery } from '@/cms/store/api/productApi';
import { useReadInventoryQuery } from '@/cms/store/api/inventoryApi';

import { useOrderListQuery, useGetOrderDataQuery } from '@/cms/store/api/order';
import type { Order } from '@/cms/types/order';

import InventoryRequestCard from './inventoryRequestCard';
import InventoryRequestList from './inventoryRequestList';
import InventoryCartDrawer, { CartItem } from './InventoryCartDrawer';
import InventoryCreateRequest from './inventoryCreateRequest';
import InventoryViewRequest from './inventoryViewRequest';
import { Brand } from '@/cms/types/brand';
import OnBackOnly from '@/cms/components/ui/pagesTemplate/onBackOnly';
import { Product } from '@/cms/types/product';
import { Inventory } from '@/cms/types/inventory';

// --- Interfaces ---

interface FilterConfig {
    search: string;
}

interface PaginationConfig {
    page: number;
    pageSize: number;
}

interface CreateUserInterfaceProps {
    onCancel: () => void;
    onSuccess: () => void;
    editItem?: Order | null;
}

const CreateInterface: React.FC<CreateUserInterfaceProps> = ({ onCancel, onSuccess, editItem }) => {
    const { t, language } = useTranslation();
    const [requestType, setRequestType] = useState<'product' | 'part'>('part');
    const [step, setStep] = useState<'brand' | 'product' | 'spare'>('brand');
    const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
    const [selectedProduct, setSelectedProduct] = useState<{ id: string, name: string, image?: string } | null>(null);
    const [selectedSpareId, setSelectedSpareId] = useState<string>('');
    const [isRequestModalOpen, setRequestModalOpen] = useState(false);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);

    const [brandPage, setBrandPage] = useState(1);
    const [productPage, setProductPage] = useState(1);
    const [sparePage, setSparePage] = useState(1);
    const [cartInitialized, setCartInitialized] = useState(false);

    const { data: orderDetail } = useGetOrderDataQuery(editItem?.orderId ?? '', {
        skip: !editItem?.orderId,
    });

    useEffect(() => {
        if (editItem && orderDetail?.data?.items && !cartInitialized) {
            const newCart: CartItem[] = orderDetail.data.items.map(oi => ({
                type: oi.partId ? 'part' : 'product',
                id: oi.partId || oi.productId,
                partId: oi.partId || '',
                productId: oi.productId || '',
                quantity: oi.quantity,
                en: oi.partId ? oi.partMeta.en : oi.productMeta.en,
                th: oi.partId ? oi.partMeta.th : oi.productMeta.th,
                price: oi.partId ? oi.partMeta?.price : oi.productMeta?.price,
            }));
            setCart(newCart);
            setCartInitialized(true);
        }
    }, [orderDetail, editItem, cartInitialized]);

    const [search, setSearch] = useState({ brand: '', product: '', spare: '' });
    const [debouncedSearch, setDebouncedSearch] = useState({ brand: '', product: '', spare: '' });

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 500);
        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        setAllBrands([]);
        setBrandPage(1);
    }, [debouncedSearch.brand]);

    useEffect(() => {
        setAllProducts([]);
        setProductPage(1);
    }, [debouncedSearch.product]);

    useEffect(() => {
        setAllSpares([]);
        setSparePage(1);
    }, [debouncedSearch.spare]);

    const [allBrands, setAllBrands] = useState<Brand[]>([]);
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [allSpares, setAllSpares] = useState<Inventory[]>([]);

    const { data: brandData, isLoading: isBrandLoading, isFetching: isBrandFetching } = useReadBrandQuery({
        search: debouncedSearch.brand,
        start: (brandPage - 1) * 24,
        length: 24,
        active: true,
    });

    useEffect(() => {
        if (brandData?.data) {
            if (brandPage === 1) setAllBrands(brandData.data);
            else setAllBrands(prev => {
                const existingIds = new Set(prev.map(b => b.brandId));
                return [...prev, ...brandData.data!.filter(b => !existingIds.has(b.brandId))];
            });
        }
    }, [brandData, brandPage]);

    const { data: productData, isLoading: isProductLoading, isFetching: isProductFetching } = useReadProductQuery({
        search: debouncedSearch.product,
        start: (productPage - 1) * 24,
        length: 24,
        brandId: selectedBrand?.brandId,
        active: true,
    }, { skip: !selectedBrand });

    useEffect(() => {
        if (productData?.data) {
            if (productPage === 1) setAllProducts(productData.data);
            else setAllProducts(prev => {
                const existingIds = new Set(prev.map(p => p.productId));
                return [...prev, ...productData.data!.filter(p => !existingIds.has(p.productId))];
            });
        }
    }, [productData, productPage]);

    const { data: spareData, isLoading: isSpareLoading, isFetching: isSpareFetching } = useReadInventoryQuery({
        search: debouncedSearch.spare,
        start: (sparePage - 1) * 24,
        length: 24,
        productId: selectedProduct?.id,
        brandId: selectedBrand?.brandId,
        active: true,
    }, { skip: step != "spare" });

    useEffect(() => {
        if (spareData?.data) {
            if (sparePage === 1) setAllSpares(spareData.data);
            else setAllSpares(prev => {
                const existingIds = new Set(prev.map(s => s.partId));
                return [...prev, ...spareData.data!.filter(s => !existingIds.has(s.partId))];
            });
        }
    }, [spareData, sparePage]);

    const handleBrandScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const target = e.currentTarget;
        if (target.scrollHeight - target.scrollTop <= target.clientHeight + 100) {
            if (!isBrandFetching && brandPage < Number(brandData?.totalPage || 1)) {
                setBrandPage(prev => prev + 1);
            }
        }
    };

    const handleProductScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const target = e.currentTarget;
        if (target.scrollHeight - target.scrollTop <= target.clientHeight + 100) {
            if (!isProductFetching && productPage < Number(productData?.totalPage || 1)) {
                setProductPage(prev => prev + 1);
            }
        }
    };

    const handleSpareScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const target = e.currentTarget;
        if (target.scrollHeight - target.scrollTop <= target.clientHeight + 100) {
            if (!isSpareFetching && sparePage < Number(spareData?.totalPage || 1)) {
                setSparePage(prev => prev + 1);
            }
        }
    };

    const renderHeader = () => (
        <div className="flex flex-col gap-3 mb-4">
            <div className="flex items-center">
                <OnBackOnly onBack={onCancel} />
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                    {editItem ? `${t('common.edit')} ${t('common.order')} ${editItem.orderId}` : t('common.request_spare_part')}
                </h2>
            </div>
            {/* Request Type Selector */}
            <div className="flex gap-2 ml-1">
                <button
                    onClick={() => {
                        setRequestType('part');
                        setStep('brand');
                        setSelectedBrand(null);
                        setSelectedProduct(null);
                    }}
                    className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold border transition-all ${requestType === 'part'
                        ? 'bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/20'
                        : 'bg-white dark:bg-gray-900 text-gray-500 border-gray-200 dark:border-gray-700 hover:border-orange-400'
                        }`}
                >
                    <Wrench className="w-4 h-4" />
                    {t('common.spare_part') || 'Request Part'}
                </button>
                <button
                    onClick={() => {
                        setRequestType('product');
                        setStep('brand');
                        setSelectedBrand(null);
                        setSelectedProduct(null);
                    }}
                    className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold border transition-all ${requestType === 'product'
                        ? 'bg-blue-500 text-white border-blue-500 shadow-md shadow-blue-500/20'
                        : 'bg-white dark:bg-gray-900 text-gray-500 border-gray-200 dark:border-gray-700 hover:border-blue-400'
                        }`}
                >
                    <Package className="w-4 h-4" />
                    {t('common.product') || 'Request Product'}
                </button>
            </div>
        </div>
    );

    const renderSidebar = () => {
        return (
            <div className="w-full lg:w-1/4 shrink-0 flex flex-col gap-4 overflow-y-auto pr-2 pb-4">
                {/* Step 1: Brand */}
                <div className={`p-4 rounded-3xl border transition-all duration-300  shadow-md ${step === 'brand' ? "border-brand-500 bg-brand-50/50 dark:bg-brand-900/10 shadow-md" : "border-gray-200 dark:border-gray-700"}`}>
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">{t('common.brand') || 'Brand'}</span>
                        {selectedBrand && step !== 'brand' && (
                            <button onClick={() => {
                                setStep('brand');
                                setSelectedBrand(null);
                            }} className="text-xs text-brand-600 dark:text-brand-400 hover:text-brand-700 font-bold bg-brand-50 dark:bg-brand-900/30 px-3 py-1 rounded-full transition-colors">{t('common.change')}</button>
                        )}
                    </div>
                    {selectedBrand ? (
                        <div className="flex items-center gap-3">
                            <div className="w-14 h-14 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                                {selectedBrand.attachment?.attUrl ? (
                                    <img src={selectedBrand.attachment.attUrl} alt={selectedBrand.en} className="w-full h-full  mix-blend-multiply dark:mix-blend-normal" />
                                ) : (
                                    <FileXIcon className='w-12 h-12 text-gray-300 dark:text-gray-700' />
                                )}
                            </div>
                            <span className="font-bold text-gray-900 dark:text-white line-clamp-1">{language === 'th' ? selectedBrand.th : selectedBrand.en}</span>
                        </div>
                    ) : (
                        <p className="text-sm text-gray-400">{t("requestSparePart.pleaseSelectBrand")}</p>
                    )}
                </div>

                {/* Step 2: Product */}
                <div className={`p-4 rounded-3xl border transition-all duration-300 ${step === 'product' ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-900/10 shadow-md' : 'border-gray-200 dark:border-gray-800'} ${step === 'brand' ? 'opacity-50 blur-[1px] pointer-events-none' : ''}`}>
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">{t('common.product') || 'Product'}</span>
                        {step === 'spare' && (
                            <button onClick={() => { setStep('product'); setSelectedProduct(null); }} className="text-xs text-brand-600 dark:text-brand-400 font-bold bg-brand-50 dark:bg-brand-900/30 px-3 py-1 rounded-full transition-colors">{selectedProduct ? t('common.change') : t('common.select')}</button>
                        )}
                    </div>
                    {selectedProduct ? (
                        <div className="flex items-center gap-3">
                            <div className="w-14 h-14 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                                {selectedProduct.image ? <img src={selectedProduct.image} alt={selectedProduct.name} className="w-full h-full mix-blend-multiply dark:mix-blend-normal" /> : <FileXIcon className='w-12 h-12 text-gray-300 dark:text-gray-700' />}
                            </div>
                            <span className="font-bold text-gray-900 dark:text-white line-clamp-2 text-sm">{selectedProduct.name}</span>
                        </div>
                    ) : (
                        <div className='flex justify-between'>
                            <p className="text-sm text-gray-400 self-center">{step === 'spare' && !selectedProduct ? t('requestSparePart.skipProduct') : t('requestSparePart.pleaseSelectProduct')}</p>
                            {step === 'product' && requestType === 'part' && <Button size='xxs' variant='dark' onClick={() => setStep('spare')}>{t('common.skip')}<ArrowBigRight /></Button>}
                        </div>
                    )}
                </div>

                {/* Step 3: Spare Part — only shown for 'part' request type */}
                {requestType === 'part' && (
                    <div className={`p-4 rounded-3xl border transition-all duration-300 ${step === 'spare' ? 'border-orange-400 bg-orange-50/50 dark:bg-orange-900/10 shadow-md' : 'border-gray-200 dark:border-gray-800'} ${['brand', 'product'].includes(step) ? 'opacity-50 blur-[1px] pointer-events-none' : ''}`}>
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">{t('common.spare_part') || 'Spare Part'}</span>
                        </div>
                        <p className="text-sm text-gray-400">{t('requestSparePart.pleaseSelectSparePart')}</p>
                    </div>
                )}
            </div>
        );
    };

    const renderBrands = () => {
        const brands = allBrands;

        return (
            <div className="flex flex-col h-full animate-in fade-in zoom-in-95 duration-300">
                <div className="mb-4">
                    <Input
                        type="text"
                        value={search.brand}
                        onChange={(e) => setSearch(prev => ({ ...prev, brand: e.target.value }))}
                        placeholder={`${t('common.search')} ${t('common.brand') || 'Brand'}...`}
                    />
                </div>
                {brands.length === 0 && !isBrandLoading && !isBrandFetching ? (
                    <div className="flex-1 flex items-center justify-center text-gray-500 rounded-3xl border border-gray-200 dark:border-gray-800 py-12">{t('common.no_result')}</div>
                ) : (
                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-6">
                        {brands.map(b => (
                            <div key={b.brandId} className="group border border-gray-200 dark:border-gray-800 rounded-3xl flex flex-col items-center bg-white dark:bg-[#0a0a0a] hover:shadow-2xl hover:shadow-brand-500/10 transition-all duration-300 hover:border-brand-500 cursor-pointer overflow-hidden" onClick={() => {
                                setSelectedBrand(b);
                                setStep('product');
                                setProductPage(1);
                                // setAllProducts([]);
                                setSelectedProduct(null);
                                setSearch(prev => ({ ...prev, product: '' }));
                            }}>
                                <div className="w-full h-48 aspect-video bg-gray-50/50 dark:bg-gray-900/30 flex items-center justify-center border-b border-gray-200 dark:border-gray-800">
                                    {b.attachment?.attUrl ?
                                        <img src={b.attachment.attUrl} alt={b.en} className="w-full h-full  duration-500" /> :
                                        // <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 text-gray-300 dark:text-gray-700"><path d="M11 22H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.706.706l3.588 3.588A2.4 2.4 0 0 1 20 8v5" /><path d="M14 2v5a1 1 0 0 0 1 1h5" /><path d="m15 17 5 5" /><path d="m20 17-5 5" /></svg>
                                        <FileXIcon className='w-12 h-12 text-gray-300 dark:text-gray-700' />
                                    }
                                </div>
                                <div className="flex-1 flex p-4 w-full bg-white dark:bg-gray-900">
                                    <h3 className=" font-bold text-center wrap-break-word whitespace-normal text-gray-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                                        {language === 'th' ? b.th : b.en}
                                    </h3>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                {isBrandFetching && (
                    <div className="py-6 flex justify-center w-full">
                        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}
            </div>
        );
    };

    const renderProducts = () => {
        if (!selectedBrand) return null;
        const products = allProducts;
        const isProductMode = requestType === 'product';

        return (
            <div className="flex flex-col h-full animate-in slide-in-from-right-8 fade-in duration-300">
                <div className="mb-4">
                    <Input
                        type="text"
                        value={search.product}
                        onChange={(e) => setSearch(prev => ({ ...prev, product: e.target.value }))}
                        placeholder={`${t('common.search')} ${t('common.product') || 'Product'}...`}
                    />
                </div>
                {products.length === 0 && !isProductLoading && !isProductFetching ? (
                    <div className="flex-1 flex items-center justify-center text-gray-500 rounded-3xl border border-gray-200 dark:border-gray-800 py-12">{t('common.no_result')}</div>
                ) : (
                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-8">
                        {products.map(p => {
                            const inCart = cart.some(c => c.id === p.productId && c.type === 'product');
                            return (
                                <div
                                    key={p.productId}
                                    className={`group border rounded-3xl flex flex-col items-center bg-white dark:bg-[#0a0a0a] hover:shadow-2xl transition-all duration-300 overflow-hidden ${isProductMode
                                        ? inCart ? 'border-blue-400 shadow-md shadow-blue-500/10' : 'border-gray-200 dark:border-gray-800 hover:border-blue-400 hover:shadow-blue-500/10'
                                        : 'border-gray-200 dark:border-gray-800 hover:border-brand-500 hover:shadow-brand-500/10 cursor-pointer'
                                        }`}
                                    onClick={() => {
                                        if (!isProductMode) {
                                            setSelectedProduct({ id: p.productId, name: language === 'th' ? p.th : p.en, image: p.attachment?.attUrl });
                                            setStep('spare');
                                            setSparePage(1);

                                            setSelectedSpareId('');
                                            setSearch(prev => ({ ...prev, spare: '' }));
                                        }
                                    }}
                                >
                                    <div className="w-full h-48 aspect-video bg-gray-50/50 dark:bg-gray-900/30 flex items-center justify-center border-b border-gray-200 dark:border-gray-800">
                                        {p.attachment?.attUrl
                                            ? <img src={p.attachment.attUrl} alt={p.en} className="w-full h-full mix-blend-multiply dark:mix-blend-normal group-hover:scale-110 transition-transform duration-500" />
                                            : <FileXIcon className='w-12 h-12 text-gray-300 dark:text-gray-700' />
                                        }
                                    </div>
                                    <div className="flex flex-col flex-1 p-4 w-full bg-white dark:bg-gray-900 gap-3">
                                        <h3 className="font-bold text-center wrap-break-word whitespace-normal text-gray-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                                            {language === 'th' ? p.th : p.en}
                                        </h3>
                                        {isProductMode && (
                                            inCart ? (
                                                <Button
                                                    onClick={() => setCart(prev => prev.filter(c => !(c.id === p.productId && c.type === 'product')))}
                                                    variant="error"
                                                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold text-red-500 hover:bg-red-50 hover:text-red-600 border-red-200 hover:border-red-300 dark:hover:bg-red-900/20 dark:border-red-900/30 transition-all"
                                                >
                                                    <ShoppingCartIcon className="w-4 h-4 fill-current" />
                                                </Button>
                                            ) : (

                                                <Button
                                                    onClick={() => setCart(prev => [...prev, { type: 'product', id: p.productId, partId: '', productId: p.productId, en: p.en, th: p.th, attUrl: p.attachment?.attUrl, quantity: 1, price: p.price }])}
                                                    variant="primary"
                                                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all"
                                                >
                                                    <ShoppingCartIcon className="w-4 h-4" />
                                                </Button>

                                            )
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
                {isProductFetching && (
                    <div className="py-6 flex justify-center w-full">
                        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}
            </div>
        );
    };

    const renderSpares = () => {
        const spares = allSpares;

        return (
            <div className="flex flex-col h-full animate-in slide-in-from-right-8 fade-in duration-300">
                <div className="mb-4">
                    <Input
                        type="text"
                        value={search.spare}
                        onChange={(e) => setSearch(prev => ({ ...prev, spare: e.target.value }))}
                        placeholder={`${t('common.search')} ${t('common.spare_part') || 'Spare Part'}...`}
                    />
                </div>
                {spares.length === 0 && !isSpareLoading && !isSpareFetching ? (
                    <div className="flex-1 flex items-center justify-center text-gray-500 rounded-3xl border border-gray-200 dark:border-gray-800 py-12">{t('common.no_result')}</div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 pb-8">
                        {spares.map(s => (
                            <div key={s.partId} className="group border border-gray-200 dark:border-gray-800 rounded-3xl p-5 flex flex-col justify-between bg-white dark:bg-gray-900 hover:shadow-2xl hover:shadow-brand-500/10 hover:border-brand-500 transition-all duration-300">
                                <div className="flex items-start gap-4 mb-5">
                                    <div className="w-14 h-14 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                                        {s.attachment?.attUrl ?
                                            <img src={s.attachment.attUrl} alt={s.en} className="w-full h-full  mix-blend-multiply dark:mix-blend-normal" /> :
                                            <FileXIcon className='w-12 h-12 text-gray-300 dark:text-gray-700' />
                                        }
                                    </div>
                                    <div className="flex-1 pt-1">
                                        <h3 className="font-bold text-gray-900 dark:text-white line-clamp-2 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors leading-snug">{language === 'th' ? s.th : s.en}</h3>
                                        {/* <div className="inline-flex items-center px-2 py-1 rounded-md text-xs font-mono font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 mt-3">
                                            {s.partId}
                                        </div> */}
                                    </div>
                                </div>
                                <div className="flex gap-2 w-full mt-2">
                                    {/* <Button onClick={() => {
                                        setSelectedSpareId(s.partId);
                                        setRequestModalOpen(true);
                                    }} variant="outline" className="flex-1 justify-center shadow-sm hover:shadow-md transition-all rounded-xl py-2 font-bold hover:bg-brand-50 hover:text-brand-600 hover:border-brand-200">
                                        {t('requestSparePart.requestSparePart')}
                                    </Button> */}

                                    {cart.some(c => c.type === 'part' && c.partId === s.partId) ? (
                                        <Button onClick={() => {
                                            setCart(prev => prev.filter(c => !(c.type === 'part' && c.partId === s.partId)));
                                        }} variant="error" className="w-full shrink-0 px-0 flex items-center justify-center shadow-sm text-red-500 hover:bg-red-50 hover:text-red-600 border-red-200 hover:border-red-300 dark:hover:bg-red-900/20 dark:border-red-900/30 transition-all rounded-xl" title={t('common.remove_from_cart') || 'Remove from cart'}>
                                            <ShoppingCartIcon className="w-5 h-5 fill-current" />
                                        </Button>
                                    ) : (
                                        <Button onClick={() => {
                                            setCart(prev => [...prev, { type: 'part', id: s.partId, partId: s.partId, productId: s.productId ?? '', en: s.en, th: s.th, attUrl: s.attachment?.attUrl, quantity: 1, price: s.price }]);
                                        }} variant="primary" className="w-full shrink-0 px-0 flex items-center justify-center shadow-sm hover:shadow-md transition-all rounded-xl" title={t('common.add_to_cart') || 'Add to cart'}>
                                            <ShoppingCartIcon className="w-5 h-5" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                {isSpareFetching && (
                    <div className="py-6 flex justify-center w-full">
                        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}
                <InventoryCreateRequest
                    isOpen={isRequestModalOpen}
                    onClose={() => setRequestModalOpen(false)}
                    onSuccess={() => {
                        setRequestModalOpen(false);
                        onSuccess();
                    }}
                    initialPartId={selectedSpareId}
                />
            </div>
        );
    };

    return (
        <div className="flex flex-col h-screen rounded-3xl overflow-hidden relative">
            <div className="pt-6 px-6 lg:px-8 border-b border-gray-100 dark:border-gray-800">
                {renderHeader()}
            </div>
            <div className="flex flex-col lg:flex-row gap-8 h-full overflow-hidden p-6 lg:p-8 bg-transparent">
                {renderSidebar()}
                <div
                    className="flex-1 overflow-y-auto pr-2 pb-25 lg:pb-10
                               [&::-webkit-scrollbar]:w-2 
                               [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-gray-700 
                               [&::-webkit-scrollbar-thumb]:rounded-full 
                               [&::-webkit-scrollbar-track]:bg-transparent"
                    onScroll={step === 'product' ? handleProductScroll : step === 'spare' ? handleSpareScroll : step === 'brand' ? handleBrandScroll : undefined}
                >
                    {step === 'brand' && renderBrands()}
                    {step === 'product' && renderProducts()}
                    {step === 'spare' && requestType === 'part' && renderSpares()}
                </div>
            </div>

            {/* Floating Cart Button */}
            {cart.length > 0 && (
                <button
                    onClick={() => setIsCartOpen(true)}
                    className="absolute bottom-8 right-8 z-30 bg-brand-500 hover:bg-brand-600 text-white rounded-full p-4 shadow-xl shadow-brand-500/30 transition-all hover:scale-105 active:scale-95 group flex items-center gap-3 pr-6"
                >
                    <div className="relative">
                        <ShoppingCartIcon className="w-6 h-6" />
                        <span className="absolute -top-2 -right-2 bg-white text-brand-600 text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-sm">{cart.length}</span>
                    </div>
                    <span className="font-bold">{t('common.view_cart') || 'View Cart'}</span>
                </button>
            )}

            {/* Slide-over Cart Drawer */}
            <InventoryCartDrawer
                isOpen={isCartOpen}
                onClose={() => setIsCartOpen(false)}
                cart={cart}
                setCart={setCart}
                onSuccess={() => {
                    setIsCartOpen(false);
                    onSuccess();
                }}
                editOrderId={editItem?.orderId}
                initialTitle={editItem?.title}
                initialShippingForm={editItem ? {
                    billTo: editItem.billTo || '',
                    billAddr: editItem.billAddr || '',
                    shipTo: editItem.shipTo || '',
                    shipBy: editItem.shipBy || '',
                    shipAddr: editItem.shipAddr || ''
                } : undefined}
            />
        </div>
    );
}


// --- Main Component ---

const RequestSparePartComponent: React.FC = () => {
    const { t } = useTranslation();
    const { addToast } = useToast();

    // --- View / mode state ---
    const [showCreate, setShowCreate] = useState(false);
    const [displayMode, setDisplayMode] = useState<'card' | 'table'>('table');
    const [searchInput, setSearchInput] = useState<string>('');
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<Order | null>(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [itemToView, setItemToView] = useState<Order | null>(null);
    const [itemToEdit, setItemToEdit] = useState<Order | null>(null);
    const permissions = usePermissions();
    const [pagination, setPagination] = useState<PaginationConfig>({ page: 1, pageSize: 10 });
    const [filterConfig, setFilterConfig] = useState<FilterConfig>({ search: '' });

    // --- API ---
    const offset = (pagination.page - 1) * pagination.pageSize;

    const { data: orderData, isLoading, isFetching, refetch } = useOrderListQuery({
        start: offset,
        length: pagination.pageSize,
        search: filterConfig.search,
    }, { refetchOnMountOrArgChange: true });

    const rawOrders = (orderData?.data as Order[]) || [];

    useEffect(() => {
        setPagination({ page: orderData?.currentPage as number || 1, pageSize: orderData?.pageSize as number || 10 });
    }, [orderData])

    const allRequests = useMemo(() => {
        // const transformed = transformOrder(rawOrders);
        // if (!filterConfig.search) return transformed;
        // const q = filterConfig.search.toLowerCase();
        // return transformed.filter(r =>
        //     r.orderId?.toLowerCase().includes(q) ||
        //     r.billTo?.toLowerCase().includes(q) ||
        //     r.requestBy?.toLowerCase().includes(q)
        // );
        return rawOrders
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rawOrders, filterConfig.search]);




    // --- Handlers ---
    const handleSearch = () => {
        setFilterConfig({ search: searchInput });
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const handleKeyDown = (event: React.KeyboardEvent) => {
        if (event.key === 'Enter') handleSearch();
    };

    const clearFilters = () => {
        setFilterConfig({ search: '' });
        setSearchInput('');
        setPagination(prev => ({ ...prev, page: 1 }));
    };



    const handleViewClick = (item: Order) => {
        setItemToView(item);
        setIsViewModalOpen(true);
    };

    const handleDeleteClick = (item: Order) => {
        setItemToDelete(item);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;
        try {
            // Delete not yet implemented in orderApi — show info toast
            addToast('error', 'Delete order is not supported yet.');
            setIsDeleteModalOpen(false);
            setItemToDelete(null);
        } catch {
            addToast('error', t('common.error'));
        }
    };


    // --- Pagination helpers ---
    const totalPages = orderData?.totalPage || 1;
    const totalCount = orderData?.totalRecords || 0;
    const startEntry = offset + 1;
    const endEntry = Math.min(offset + pagination.pageSize, Number(totalCount));

    if (isViewModalOpen && !itemToEdit) {
        return <InventoryViewRequest
            onClose={() => setIsViewModalOpen(false)}
            onEdit={() => {
                setItemToEdit(itemToView);
            }}
            item={itemToView}
        />
    }
    // --- View: List ---
    return (
        <>
            {showCreate || itemToEdit ? (
                <div className="min-h-screen rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/3">
                    <div className="mx-auto w-full">
                        <CreateInterface
                            onCancel={() => { setShowCreate(false); setItemToEdit(null); }}
                            onSuccess={() => { setShowCreate(false); setItemToEdit(null); refetch(); }}
                            editItem={itemToEdit}
                        />
                    </div>
                </div>
            ) : (
                <div className="min-h-screen rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/3 xl:px-10 xl:py-12">
                    <div className="mx-auto w-full">
                        <div className="flex flex-col justify-between min-h-screen">
                            <div className="min-h-screen">
                                <div className="mb-8">
                                    <h3 className="text-xl font-semibold mb-6 text-gray-800 dark:text-white">
                                        {t('common.order')}
                                    </h3>
                                    
                                    <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">

                                            {/* View Toggle */}
                                            <div className="flex rounded-lg overflow-hidden w-full sm:w-auto">
                                                <Button
                                                    onClick={() => setDisplayMode('table')}
                                                    className="rounded-r-none flex-1 sm:flex-initial"
                                                    variant={displayMode === 'table' ? 'primary' : 'outline'}
                                                >
                                                    <ListIcon className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    onClick={() => setDisplayMode('card')}
                                                    className="rounded-l-none flex-1 sm:flex-initial"
                                                    variant={displayMode === 'card' ? 'primary' : 'outline'}
                                                >
                                                    <GridIcon className="w-4 h-4" />
                                                </Button>
                                            </div>

                                            {/* Search */}
                                            <Input
                                                type="text"
                                                value={searchInput}
                                                onChange={(e) => setSearchInput(e.target.value)}
                                                placeholder="Search request ID or part..."
                                                className="w-full sm:w-64"
                                                onKeyDown={handleKeyDown}
                                            />
                                            <Button onClick={handleSearch} variant="dark" className="h-11">
                                                {t('common.search')}
                                            </Button>

                                            {/* Clear Filters */}
                                            {filterConfig.search && (
                                                <Button onClick={clearFilters} className="h-11">
                                                    <CloseIcon className="w-4 h-4 mr-2" />
                                                    {t('common.clear_filters')}
                                                </Button>
                                            )}
                                        </div>

                                        {/* Request New Button */}
                                        {permissions.hasPermission("order.create") && <Button 
                                            variant="primary"
                                            className="w-full sm:w-auto"
                                            onClick={() => setShowCreate(true)}
                                        >
                                            {t("common.add")}
                                        </Button>}
                                    </div>
                                </div>

                                {/* Content Area */}
                                {isFetching || isLoading ? (
                                    <Loading />
                                ) : allRequests.length === 0 ? (
                                    <div className="text-center py-12">
                                        <p className="text-gray-500 text-lg">{t('common.no_result')}</p>
                                    </div>
                                ) : displayMode === 'card' ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                                        {allRequests.map((item) => (
                                            <InventoryRequestCard
                                                key={item.orderId}
                                                item={item}
                                                onView={handleViewClick}
                                                onDelete={handleDeleteClick}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <InventoryRequestList
                                        data={allRequests}
                                        onView={handleViewClick}
                                        onDelete={handleDeleteClick}
                                    />
                                )}
                            </div>

                            {/* Pagination */}
                            <div className="mt-6">
                                <Pagination
                                    pagination={{ page: pagination.page, pageSize: pagination.pageSize, total: Number(totalCount) }}
                                    totalPages={Number(totalPages)}
                                    startEntry={startEntry}
                                    endEntry={endEntry}
                                    onPageChange={(newPage) => setPagination(prev => ({ ...prev, page: newPage }))}
                                    onPageSizeChange={(newPageSize) => setPagination(prev => ({
                                        ...prev,
                                        pageSize: Number(newPageSize),
                                        page: 1,
                                    }))}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirm Modal */}
            {isDeleteModalOpen && itemToDelete && (
                <ConfirmModal
                    title={t('common.delete') + " " + itemToDelete.orderId}
                    message={`${t('common.delete')} ${itemToDelete.orderId}?`}
                    confirmLabel={t('common.delete')}
                    cancelLabel={t('common.cancel')}
                    confirmVariant="error"
                    loading={false}
                    onConfirm={handleConfirmDelete}
                    onCancel={() => setIsDeleteModalOpen(false)}
                    open={isDeleteModalOpen}
                />
            )}

            {/* Create Request Modal */}
            {/* <InventoryCreateRequest
                isOpen={showCreateModal}
                onClose={handleCloseModal}
                onSuccess={refetch}
            /> */}

            {/* View Request Modal */}

        </>
    );
};

export default RequestSparePartComponent;