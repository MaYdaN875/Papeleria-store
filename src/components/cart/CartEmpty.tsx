import { Link } from "react-router"

export function CartEmpty() {
    return (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <div className="w-48 h-48 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-6xl text-slate-300">shopping_cart</span>
            </div>
            <h2 className="font-headline font-bold text-3xl text-slate-800 mb-4">Tu Carrito Está Vacío</h2>
            <p className="text-slate-500 font-body text-base max-w-md mb-8">
                Tenemos grandes productos y ofertas que podrían interesarte. ¡Agrega lo que necesitas a tu carrito!
            </p>
            <Link 
                to="/" 
                className="bg-[#00897B] hover:bg-teal-700 text-white font-headline font-bold py-3 px-8 rounded-lg transition-colors shadow-sm"
            >
                Volver a la tienda
            </Link>
        </div>
    )
}
