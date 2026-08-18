// src/cms/components/crm/request/InventoryCartDrawer.tsx
import React, {
    // useMemo,
    useState
} from 'react';
import { useTranslation } from '@/core/hooks/useTranslation';
import { useToast } from '@/core/hooks';
import Button from '@/core/components/ui/button/Button';
import { useCreateOrderMutation, useUpdateOrderInfoMutation, useAddOrderItemMutation, useDeleteOrderItemMutation, useGetOrderDataQuery } from '@/cms/store/api/order';
import { useUpdateOrderItemByRequestMutationMutation } from '@/cms/store/api/orderItem';
import { SearchableSelect } from '@/cms/components/SearchInput/SearchSelectInput';
import { SHIPPING_COMPANIES } from '@/cms/utils/constants';
import { CloseIcon, TrashBinIcon } from '@/core/icons';
import { FileXIcon, ShoppingCartIcon, Plus, Minus, ChevronDown, ChevronUp, Package, Wrench, Pen, ReceiptText, Truck } from 'lucide-react';
import Input from '@/core/components/form/input/InputField';
import Badge from '@/core/components/ui/badge/Badge';

export interface CartItem {
    /** 'part' for spare parts, 'product' for products */
    type: 'part' | 'product';
    id: string;
    partId: string;
    productId?: string;
    en?: string;
    th?: string;
    attUrl?: string;
    quantity: number;
    price: number;
}

interface ShippingForm {
    billTo: string;
    billAddr: string;
    shipTo: string;
    shipBy: string;
    shipAddr: string;
}

interface InventoryCartDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    cart: CartItem[];
    setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
    onSuccess: () => void;
    editOrderId?: string;
    initialTitle?: string;
    initialShippingForm?: ShippingForm;
}

const emptyShippingForm: ShippingForm = { billTo: '', billAddr: '', shipTo: '', shipBy: '', shipAddr: '' };

const InventoryCartDrawer: React.FC<InventoryCartDrawerProps> = ({ isOpen, onClose, cart, setCart, onSuccess, editOrderId, initialTitle, initialShippingForm }) => {
    const { t, language } = useTranslation();
    const { addToast } = useToast();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showBilling, setShowBilling] = useState(false);
    const [showShipping, setShowShipping] = useState(false);
    const [shippingForm, setShippingForm] = useState<ShippingForm>(emptyShippingForm);

    const [createOrder] = useCreateOrderMutation();
    const [updateOrderInfo] = useUpdateOrderInfoMutation();
    const [addOrderItem] = useAddOrderItemMutation();
    const [deleteOrderItem] = useDeleteOrderItemMutation();
    const [updateOrderItemByRequest] = useUpdateOrderItemByRequestMutationMutation();

    const { data: orderDetail } = useGetOrderDataQuery(editOrderId ?? '', {
        skip: !editOrderId,
    });
    // const profile = useMemo(() => JSON.parse(localStorage.getItem('profile') ?? '{}'), []);

    React.useEffect(() => {
        if (isOpen) {
            if (initialShippingForm) {
                setShippingForm(initialShippingForm);
            }
            if (editOrderId && initialTitle) {
                setTitle(initialTitle);
                setIsTitleEdited(true);
            } else if (!isTitleEdited) {
                setTitle(titleTextGen());
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, initialShippingForm, editOrderId, initialTitle]);

    const titleTextGen = () => {
        return cart
            .map((item) => `${item.en} x${item.quantity}`)
            .join(', ');
    };



    const partItems = cart.filter(i => i.type === 'part');
    const productItems = cart.filter(i => i.type === 'product');
    const [title, setTitle] = useState<string>('');
    const [isTitleEdited, setIsTitleEdited] = useState<boolean>(false);
    const [isEditingTitle, setIsEditingTitle] = useState<boolean>(false);

    React.useEffect(() => {
        if (isOpen && !isTitleEdited) {
            setTitle(titleTextGen());
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cart, isTitleEdited, isOpen]);
    // --- Cart actions ---
    const updateQuantity = (id: string, newQty: number) => {
        if (newQty < 1) return;
        setCart(prev => prev.map(item => item.id === id ? { ...item, quantity: newQty } : item));
    };

    const removeItem = (id: string) => setCart(prev => prev.filter(item => item.id !== id));

    const handleQuantityChange = (id: string, val: string) => {
        const parsed = parseInt(val, 10);
        if (!isNaN(parsed) && parsed >= 1) updateQuantity(id, parsed);
    };

    const setField = (field: keyof ShippingForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
        setShippingForm(prev => ({ ...prev, [field]: e.target.value }));

    // --- Submit ---
    const handleSubmit = async () => {
        if (cart.length === 0) { addToast('error', t('common.error')); return; }
        if (!shippingForm.billTo || !shippingForm.shipTo || !shippingForm.shipBy) {
            addToast('error', t('common.required_fields')); return;
        }

        setIsSubmitting(true);
        try {
            const requests = cart.map(item => ({
                active: true as const,
                partId: item.type === 'part' ? item.partId : undefined,
                productId: item.productId,
                quantity: item.quantity,
            }));

            if (editOrderId) {
                await updateOrderInfo({
                    orderId: editOrderId,
                    billTo: shippingForm.billTo,
                    billAddr: shippingForm.billAddr,
                    shipTo: shippingForm.shipTo,
                    shipBy: shippingForm.shipBy,
                    title: title,
                    shipAddr: shippingForm.shipAddr,
                }).unwrap();

                const originalItems = orderDetail?.data?.items || [];

                // Find items to delete: in originalItems but not in cart
                const itemsToDelete = originalItems.filter(oi => {
                    const existsInCart = cart.some(c =>
                        (oi.partId && c.partId === oi.partId) ||
                        (oi.productId && !oi.partId && c.productId === oi.productId)
                    );
                    return !existsInCart;
                });

                // Find items to create: in cart but not in originalItems
                const itemsToCreate = cart.filter(c => {
                    const existsInOriginal = originalItems.some(oi =>
                        (oi.partId && oi.partId === c.partId) ||
                        (oi.productId && !oi.partId && oi.productId === c.productId)
                    );
                    return !existsInOriginal;
                });

                // Find items to update: in both, but with different quantity
                const itemsToUpdate = cart.filter(c => {
                    const matchingOriginal = originalItems.find(oi =>
                        (oi.partId && oi.partId === c.partId) ||
                        (oi.productId && !oi.partId && oi.productId === c.productId)
                    );
                    return matchingOriginal && matchingOriginal.quantity !== c.quantity;
                });

                // Execute deletes
                for (const item of itemsToDelete) {
                    await deleteOrderItem({
                        orderId: editOrderId,
                        itemId: item.requestId,
                    }).unwrap();
                }

                // Execute creates
                for (const item of itemsToCreate) {
                    await addOrderItem({
                        orderId: editOrderId,
                        partId: item.type === 'part' ? item.partId : undefined,
                        productId: item.productId,
                        quantity: item.quantity,
                    }).unwrap();
                }

                // Execute updates
                for (const item of itemsToUpdate) {
                    const matchingOriginal = originalItems.find(oi =>
                        (oi.partId && oi.partId === item.partId) ||
                        (oi.productId && !oi.partId && oi.productId === item.productId)
                    );
                    if (matchingOriginal) {
                        await updateOrderItemByRequest({
                            orderId: editOrderId,
                            requestId: matchingOriginal.requestId,
                            partId: item.type === 'part' ? item.partId : undefined,
                            productId: item.productId || '',
                            quantity: item.quantity,
                        }).unwrap();
                    }
                }

                addToast('success', t('common.success') || 'Updated successfully');
            } else {
                await createOrder({
                    billTo: shippingForm.billTo,
                    billAddr: shippingForm.billAddr,
                    // requestBy: profile.username || '',
                    shipTo: shippingForm.shipTo,
                    shipBy: shippingForm.shipBy,
                    title: title,
                    shipAddr: shippingForm.shipAddr,
                    items: requests as [{ active: true; partId: string; productId: string; quantity: number }],
                }).unwrap();
                addToast('success', t('requestSparePart.orderCreated'));
            }

            setCart([]);
            setShippingForm(emptyShippingForm);
            onClose();
            onSuccess();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            addToast('error', error?.data?.message || t('common.error'));
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen && cart.length === 0) return null;

    // --- Cart item group renderer ---
    const renderCartGroup = (items: CartItem[], label: string, icon: React.ReactNode, color: string) => {
        if (items.length === 0) return null;
        return (
            <div className="mb-4">
                <div className="flex items-center gap-2 px-1 mb-2">
                    <span className={`p-1 rounded-md ${color}`}>{icon}</span>
                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">{label}</span>
                    <span className="ml-auto text-xs font-bold text-gray-400">{items.length}</span>
                </div>
                <div className="space-y-3">
                    {items.map(item => (
                        <div key={item.id} className="group flex gap-4 p-4 rounded-2xl border border-gray-100 hover:border-brand-500/30 dark:border-gray-800 bg-white dark:bg-gray-900 transition-all shadow-sm hover:shadow-md">
                            {/* Thumbnail */}
                            <div className="w-16 h-16 rounded-xl bg-gray-50 dark:bg-gray-800/50 flex items-center justify-center p-2 shrink-0 border border-gray-100 dark:border-gray-800">
                                {item.attUrl
                                    ? <img src={item.attUrl} alt={item.en} className="w-full h-full mix-blend-multiply dark:mix-blend-normal object-contain" />
                                    : <FileXIcon className="w-7 h-7 text-gray-300 dark:text-gray-700" />
                                }
                            </div>

                            {/* Info & controls */}
                            <div className="flex-1 flex flex-col justify-between py-0.5">
                                <div className="flex justify-between items-start gap-2">
                                    <h4 className="font-bold text-sm text-gray-900 dark:text-white line-clamp-2 leading-tight">
                                        {language === 'th' ? item.th : item.en}
                                    </h4>
                                    <button
                                        onClick={() => removeItem(item.id)}
                                        className="text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-1.5 rounded-lg transition-colors shrink-0"
                                        title={t('common.remove_from_cart')}
                                    >
                                        <TrashBinIcon className="w-4 h-4" />
                                    </button>
                                </div>
                                <div>
                                    {item.price !== undefined && (
                                        <span className="text-sm font-semibold text-brand-600 dark:text-brand-400">
                                            ฿{item.price.toLocaleString()}
                                        </span>
                                    )}
                                </div>

                                {/* Qty stepper */}
                                <div className="flex items-center gap-3 mt-2">
                                    <span className="text-xs font-bold text-gray-500 uppercase">{t('common.quantity')}</span>
                                    <div className="flex items-center border border-gray-200 dark:border-gray-700 dark:text-white rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-800/50">
                                        <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="px-2.5 py-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-300">
                                            <Minus className="w-3.5 h-3.5" />
                                        </button>
                                        <input
                                            type="number" min="1" value={item.quantity}
                                            onChange={e => handleQuantityChange(item.id, e.target.value)}
                                            className="w-12 text-center text-sm font-bold bg-transparent border-x border-gray-200 dark:border-gray-700 focus:outline-none py-1.5 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        />
                                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="px-2.5 py-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-300">
                                            <Plus className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    // --- Collapsible section ---
    const renderSection = (
        label: string,
        show: boolean,
        toggle: () => void,
        children: React.ReactNode,
        icon?: React.ReactNode
    ) => (
        <div className="border-t border-gray-100 dark:border-gray-800 shrink-0">
            <button type="button" onClick={toggle} className="w-full flex items-center justify-between px-6 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <div className="flex items-center gap-2">
                    {icon}
                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">{label}</span>
                </div>
                {show ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>
            {show && <div className="px-6 pb-4 space-y-3">{children}</div>}
        </div>
    );

    const formField = (label: string, field: keyof ShippingForm, required = false, placeholder = '') => (
        <div>
            <label className="block text-xs font-semibold mb-1 text-gray-600 dark:text-gray-400">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <Input type="text" value={shippingForm[field]} onChange={setField(field)} placeholder={placeholder} />
        </div>
    );

    return (
        <>
            {/* Backdrop */}
            {isOpen && <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity" onClick={onClose} />}

            {/* Slide-over Panel */}
            <div className={`fixed inset-y-0 right-0 z-999999 w-full md:w-125 bg-white dark:bg-gray-900 shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>

                {/* Header */}
                <div className="flex items-center justify-between p-6 bg-brand-50/50 dark:bg-brand-900/10 border-b border-gray-100 dark:border-gray-800 shrink-0">
                    <div className="flex items-center gap-3 relative">
                        <div className="bg-brand-500/10 p-2.5 rounded-full text-brand-600 dark:text-brand-400">
                            <ShoppingCartIcon className="w-6 h-6" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('common.cart')}</h2>
                        <span className="bg-brand-500 text-white text-xs font-bold px-2.5 py-1 rounded-full absolute -top-1 -right-4 shadow-sm shadow-brand-500/30">{cart.length}</span>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-white dark:hover:bg-gray-800 rounded-full transition-colors flex shrink-0">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Type summary chips */}
                {cart.length > 0 && (
                    <div className="flex gap-2 px-6 pt-4 shrink-0">
                        {productItems.length > 0 && (
                            <span className="inline-flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-bold px-3 py-1.5 rounded-full">
                                <Package className="w-3.5 h-3.5" />
                                {productItems.length} {t('common.product')}
                            </span>
                        )}
                        {partItems.length > 0 && (
                            <span className="inline-flex items-center gap-1.5 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 text-xs font-bold px-3 py-1.5 rounded-full">
                                <Wrench className="w-3.5 h-3.5" />
                                {partItems.length} {t('common.spare_part')}
                            </span>
                        )}
                    </div>
                )}

                {/* Cart items */}
                <div className="flex-1 overflow-y-auto px-6 pt-4 pb-2 space-y-1 custom-scrollbar">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-4 opacity-50">
                            <ShoppingCartIcon className="w-16 h-16" />
                            <p>{t('common.no_parts_added')}</p>
                        </div>
                    ) : (
                        <>
                            {renderCartGroup(productItems, t('common.product'), <Package className="w-3.5 h-3.5" />, 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400')}
                            {renderCartGroup(partItems, t('common.spare_part'), <Wrench className="w-3.5 h-3.5" />, 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400')}
                        </>
                    )}
                </div>

                {/* Billing section */}
                {!editOrderId && renderSection(
                    t('common.billing_info'),
                    showBilling,
                    () => setShowBilling(v => !v),
                    <>
                        {formField(t('common.bill_to'), 'billTo', true, t('common.bill_to_placeholder'))}
                        {formField(t('common.bill_addr'), 'billAddr', false, t('common.bill_addr_placeholder'))}
                    </>,
                    <ReceiptText className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                )}

                {/* Shipping section */}
                {!editOrderId && renderSection(
                    t('common.shipping_info'),
                    showShipping,
                    () => setShowShipping(v => !v),
                    <>
                        {formField(t('common.ship_to'), 'shipTo', true, t('common.ship_to_placeholder'))}
                        <div>
                            <label className="block text-xs font-semibold mb-1 text-gray-600 dark:text-gray-400">
                                {t('common.ship_by')} <span className="text-red-500">*</span>
                            </label>
                            <SearchableSelect
                                options={SHIPPING_COMPANIES}
                                value={shippingForm.shipBy}
                                onChange={val => setShippingForm(prev => ({ ...prev, shipBy: val }))}
                                placeholder={t('common.ship_by_placeholder')}
                            />
                        </div>
                        {formField(t('common.ship_addr'), 'shipAddr', false, t('common.ship_addr_placeholder'))}
                    </>,
                    <Truck className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                )}
                {!editOrderId && <div className="px-6 py-4 border-t flex justify-between items-center border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0">
                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{t("common.total_price")}</span>
                    <span className="text-lg font-bold text-brand-600 dark:text-brand-400">
                        ฿{cart.reduce((sum, item) => sum + ((item.price || 0) * item.quantity), 0).toLocaleString()}
                    </span>
                </div>}
                {/* Footer / Submit */}
                <div className="p-3 border-t space-y-2.5 border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0">
                    {isEditingTitle ? (
                        <div className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800/50 w-full">
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => {
                                    setTitle(e.target.value);
                                    setIsTitleEdited(true);
                                }}
                                onBlur={() => setIsEditingTitle(false)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        setIsEditingTitle(false);
                                    }
                                }}
                                autoFocus
                                className="bg-transparent border-none outline-none p-0 text-xs font-semibold w-full text-green-800 dark:text-green-400 focus:ring-0 focus:outline-none"
                            />
                        </div>
                    ) : (
                        <span onClick={() => setIsEditingTitle(true)} className="cursor-pointer inline-block">
                            <Badge
                                color="success"
                                size="sm"
                                className="hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors py-1 px-3 flex items-center gap-1.5 w-fit"
                            >
                                <span className="truncate max-w-[320px]">{title || titleTextGen()}</span>
                                <Pen className="w-3 h-3 text-green-600 dark:text-green-400" />
                            </Badge>
                        </span>
                    )}
                    <Button
                        onClick={handleSubmit}
                        variant="primary"
                        disabled={cart.length === 0 || isSubmitting || !shippingForm.billTo || !shippingForm.shipTo || !shippingForm.shipBy}
                        className="w-full justify-center py-4 rounded-xl shadow-lg shadow-brand-500/20 text-md font-bold transition-all disabled:opacity-50"
                    >
                        {isSubmitting ? (
                            <span className="flex items-center gap-2">
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                {t('common.processing_requests')}
                            </span>
                        ) : (
                            editOrderId ? `${t('common.confirm_edit')}` : `${t('common.submit')} ${cart.length} ${t('common.order')}`
                        )}
                    </Button>
                </div>
            </div>
        </>
    );
};

export default InventoryCartDrawer;
