// src/cms/components/crm/request/inventoryCreateRequest.tsx
import React, {
    // useMemo,
    useState
} from 'react';
import Button from '@/core/components/ui/button/Button';
import Input from '@/core/components/form/input/InputField';
import { Modal } from '@/core/components/ui/modal';
import { SearchableSelectApi, SearchableSelect } from '@/cms/components/SearchInput/SearchSelectInput';
import { useTranslation } from '@/core/hooks/useTranslation';
import { useReadInventoryQuery } from '@/cms/store/api/inventoryApi';
import { useCreateOrderMutation } from '@/cms/store/api/order';
import { useToast } from '@/core/hooks';
import { SHIPPING_COMPANIES } from '@/cms/utils/constants';

interface InventoryCreateRequestProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    initialPartId?: string;
}

const InventoryCreateRequest: React.FC<InventoryCreateRequestProps> = ({
    isOpen, onClose, onSuccess, initialPartId,
}) => {
    const { t, language } = useTranslation();
    const { addToast } = useToast();

    // const profile = useMemo(() => JSON.parse(localStorage.getItem('profile') ?? '{}'), []);

    const emptyForm = { title: '', partId: initialPartId || '', quantity: '', billTo: '', billAddr: '', shipTo: '', shipBy: '', shipAddr: '' };
    const [formData, setFormData] = useState(emptyForm);

    React.useEffect(() => {
        if (isOpen) setFormData(prev => ({ ...prev, partId: initialPartId || '' }));
    }, [isOpen, initialPartId]);

    const [createOrder, { isLoading: isCreating }] = useCreateOrderMutation();

    const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
        setFormData(prev => ({ ...prev, [field]: e.target.value }));

    const handleClose = () => {
        setFormData({ ...emptyForm });
        onClose();
    };

    const handleSubmit = async () => {
        if (!formData.title || !formData.partId || !formData.quantity || !formData.billTo || !formData.shipTo || !formData.shipBy) {
            addToast('error', t('common.required_fields'));
            return;
        }
        try {
            const response = await createOrder({
                billTo: formData.billTo,
                billAddr: formData.billAddr,
                // requestBy: profile.username || '',
                shipTo: formData.shipTo,
                shipBy: formData.shipBy,
                shipAddr: formData.shipAddr,
                title: formData.title,
                items: [{ active: true, partId: formData.partId, productId: '', quantity: Number(formData.quantity) }],
            }).unwrap();

            if (response?.status) {
                addToast('success', t('requestSparePart.orderCreated'));
                handleClose();
                onSuccess?.();
            } else {
                addToast('error', response?.message || t('requestSparePart.orderFailed'));
            }
        } catch (error: unknown) {
            addToast('error', (error as { data?: { message?: string } })?.data?.message || t('common.error'));
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} className="max-w-lg p-6">
            <h3 className="text-xl font-semibold mb-6 text-gray-800 dark:text-white">
                {t('common.newOrder')}
            </h3>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                        {t('common.title') || 'Title'} <span className="text-red-500">*</span>
                    </label>
                    <Input type="text" value={formData.title} onChange={set('title')} placeholder={t('common.title_placeholder') || 'Enter order title'} className="w-full" />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                        {t('common.part')} <span className="text-red-500">*</span>
                    </label>
                    <SearchableSelectApi
                        value={formData.partId}
                        onChange={(val) => setFormData(prev => ({ ...prev, partId: val }))}
                        placeholder={t('common.selectSparePart')}
                        apiQuery={useReadInventoryQuery}
                        enablePaginate={true}
                        queryParams={{ start: 0, length: 20 }}
                        labelKey={language === 'th' ? 'th' : 'en'}
                        valueKey="partId"
                        className="w-full"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                        {t('common.quantity')} <span className="text-red-500">*</span>
                    </label>
                    <Input type="number" value={formData.quantity} onChange={set('quantity')} className="w-full" />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                        {t('common.bill_to')} <span className="text-red-500">*</span>
                    </label>
                    <Input type="text" value={formData.billTo} onChange={set('billTo')} placeholder={t('common.bill_to_placeholder')} className="w-full" />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                        {t('common.bill_addr')}
                    </label>
                    <Input type="text" value={formData.billAddr} onChange={set('billAddr')} placeholder={t('common.bill_addr_placeholder')} className="w-full" />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                        {t('common.ship_to')} <span className="text-red-500">*</span>
                    </label>
                    <Input type="text" value={formData.shipTo} onChange={set('shipTo')} placeholder={t('common.ship_to_placeholder')} className="w-full" />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                        {t('common.ship_by')} <span className="text-red-500">*</span>
                    </label>
                    <SearchableSelect
                        options={SHIPPING_COMPANIES}
                        value={formData.shipBy}
                        onChange={val => setFormData(f => ({ ...f, shipBy: val }))}
                        placeholder={t('common.ship_by_placeholder')}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                        {t('common.ship_addr')}
                    </label>
                    <Input type="text" value={formData.shipAddr} onChange={set('shipAddr')} placeholder={t('common.ship_addr_placeholder')} className="w-full" />
                </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
                <Button variant="outline" onClick={handleClose} disabled={isCreating}>
                    {t('common.cancel')}
                </Button>
                <Button variant="primary" onClick={handleSubmit} disabled={isCreating}>
                    {isCreating ? t('common.loading') : t('common.create')}
                </Button>
            </div>
        </Modal>
    );
};

export default InventoryCreateRequest;
