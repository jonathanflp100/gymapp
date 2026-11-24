import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ShoppingBag } from 'lucide-react';
import { useBrand } from '../../context/BrandContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import type { PublicGym } from '../../types';
import { storefrontApi } from '../../services/storefrontApi';
import { ProductCard, STORE_TXT } from '../../components/store/StoreParts';

export const ShopView: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const { brand } = useBrand();
  const { language } = useLanguage();
  const { currentUser } = useAuth();
  const [data, setData] = useState<PublicGym | null>(null);
  const [cat, setCat] = useState('');

  useEffect(() => {
    storefrontApi.publicData(brand, language).then(setData).catch(() => setData(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const es = language === 'es-PY';
  const cats = useMemo(() => [...new Set((data?.products ?? []).map((p) => p.category).filter(Boolean))], [data]);
  const list = (data?.products ?? []).filter((p) => !cat || p.category === cat);

  return (
    <div className="space-y-4 pb-6">
      <div className="flex items-center gap-3">
        {onBack && (
          <button onClick={onBack} className="p-2 -ml-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800" aria-label="Voltar">
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <div>
          <h1 className="text-xl font-black text-white">{es ? 'Tienda del gimnasio' : 'Loja da academia'}</h1>
          <p className="text-xs text-slate-400">{es ? 'Pedí por WhatsApp y retirá en el gimnasio' : 'Peça pelo WhatsApp e retire na academia'}</p>
        </div>
      </div>

      {cats.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {['', ...cats].map((c) => (
            <button
              key={c || 'all'}
              onClick={() => setCat(c)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold border ${cat === c ? 'text-white border-transparent' : 'text-slate-300 border-slate-700'}`}
              style={cat === c ? { backgroundColor: brand.primaryColor } : undefined}
            >
              {c || (es ? 'Todo' : 'Tudo')}
            </button>
          ))}
        </div>
      )}

      {!data ? (
        <p className="text-sm text-slate-400 text-center py-10">{es ? 'Cargando…' : 'Carregando…'}</p>
      ) : list.length === 0 ? (
        <div className="text-center py-12 text-slate-400 text-sm">
          <ShoppingBag className="w-10 h-10 mx-auto mb-3 text-slate-600" />
          {es ? 'Todavía no hay productos.' : 'Ainda não há produtos.'}
        </div>
      ) : (
        <>
          {!data.brand.whatsapp && <p className="text-xs text-amber-300">{STORE_TXT[language].noWhats}</p>}
          <div className="grid grid-cols-2 gap-3">
            {list.map((p) => (
              <ProductCard key={p.id} p={p} lang={language} whatsapp={data.brand.whatsapp} color={brand.primaryColor} studentName={currentUser?.name} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};
