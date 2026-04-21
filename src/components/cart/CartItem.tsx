import { useNavigate } from "react-router"
import { getProductById } from "../../data/products"
import {
    getCartItemSubtotal,
    getCartItemUnitPrice,
    type CartItem as CartItemType,
} from "../../utils/cart"

interface CartItemProps {
    item: CartItemType
    isRemoving: boolean
    onQuantityChange: (id: number, value: number) => void
    onRemove: (id: number) => void
}

export function CartItem({
    item,
    isRemoving,
    onQuantityChange,
    onRemove,
}: CartItemProps) {
    const unitPrice = getCartItemUnitPrice(item)
    const subtotal = getCartItemSubtotal(item)
    const navigate = useNavigate()
    const isMayoreo =
        item.mayoreoMinQty != null &&
        item.mayoreoPrice != null &&
        item.quantity >= item.mayoreoMinQty
    const linkedProduct = item.productId ? getProductById(item.productId) : undefined
    const imageSrc = item.image ?? linkedProduct?.image ?? "images/placeholder.png"

    const handleDecrement = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (item.quantity > 1) {
            onQuantityChange(item.id, item.quantity - 1)
        }
    }

    const handleIncrement = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (item.quantity < 99) {
            onQuantityChange(item.id, item.quantity + 1)
        }
    }

    return (
        <div
            className={`bg-white rounded-xl p-4 md:p-6 flex flex-row items-center gap-4 md:gap-6 shadow-sm border border-slate-200 transition-all duration-300 ${isRemoving ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'}`}
            onClick={() => {
                if (item.productId) {
                    navigate(`/product/${item.productId}?returnTo=/cart`)
                }
            }}
            role={item.productId ? "button" : undefined}
            tabIndex={item.productId ? 0 : undefined}
            onKeyDown={(event) => {
                if (!item.productId) return
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault()
                    navigate(`/product/${item.productId}?returnTo=/cart`)
                }
            }}
            style={{ cursor: item.productId ? "pointer" : "default" }}
        >
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-lg overflow-hidden shrink-0 bg-white border border-slate-100 flex items-center justify-center p-2">
                <img src={imageSrc} alt={linkedProduct?.name ?? "Imagen del producto"} className="max-w-full max-h-full object-contain" />
            </div>
            
            <div className="flex-grow flex flex-col justify-between py-1">
                <div>
                    <h3 className="font-headline font-semibold text-base md:text-lg text-slate-800 mb-1 leading-tight">
                        {item.name}
                    </h3>
                    {isMayoreo && (
                        <span className="text-xs font-bold text-green-600 block mb-1">
                            (Precio Mayoreo Aplicado)
                        </span>
                    )}
                    <div className="md:hidden text-lg font-bold text-slate-900 mt-2">
                        ${unitPrice.toFixed(2)}
                    </div>
                </div>
                
                <div className="flex items-center justify-between mt-4">
                    <div className="hidden md:block text-base font-bold text-[#00685d]">
                        ${subtotal.toFixed(2)}
                    </div>
                    
                    <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg" onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={handleDecrement}
                            className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-l-lg transition-colors"
                        >
                            <span className="material-symbols-outlined text-sm">remove</span>
                        </button>
                        <div className="w-10 text-center text-sm font-medium text-slate-800 bg-white border-x border-slate-200 py-1">
                            {item.quantity}
                        </div>
                        <button
                            onClick={handleIncrement}
                            className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-r-lg transition-colors"
                        >
                            <span className="material-symbols-outlined text-sm">add</span>
                        </button>
                    </div>
                    
                    <button
                        onClick={(e) => { e.stopPropagation(); onRemove(item.id); }}
                        aria-label="Remove item"
                        className="ml-auto md:ml-4 text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 w-10 h-10 rounded-lg flex items-center justify-center transition-colors"
                    >
                        <span className="material-symbols-outlined text-xl">delete</span>
                    </button>
                </div>
            </div>
        </div>
    )
}
