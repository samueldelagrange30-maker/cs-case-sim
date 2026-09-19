import { Navigate, Route, Routes } from 'react-router-dom'
import { Header } from './components/Header'
import { useCases } from './hooks/useCases'
import { useInventory } from './hooks/useInventory'
import { CasePage } from './pages/CasePage'
import { HomePage } from './pages/HomePage'
import { InventoryPage } from './pages/InventoryPage'

export default function App() {
  const { cases, loading, error } = useCases()
  const { items, addItems, clear, count } = useInventory()

  return (
    <div className="min-h-screen flex flex-col">
      <Header inventoryCount={count} />
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-6 sm:py-8">
        {loading && (
          <p className="text-center text-muted py-20">
            Chargement des caisses &amp; capsules…
          </p>
        )}
        {error && (
          <p className="text-center text-covert py-20">
            Impossible de charger les données : {error}
          </p>
        )}
        {!loading && !error && (
          <Routes>
            <Route path="/" element={<HomePage cases={cases} />} />
            <Route
              path="/case/:id"
              element={<CasePage onOpened={addItems} />}
            />
            <Route
              path="/inventory"
              element={<InventoryPage items={items} onClear={clear} />}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        )}
      </main>
      <footer className="border-t border-border py-4 text-center text-[11px] text-muted px-4">
        Données skins : ByMykel CSGO-API · Skin Csgo — Simulateur de caisses
        &amp; capsules
      </footer>
    </div>
  )
}
