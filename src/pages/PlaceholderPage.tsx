import { Card } from '../components/ui/Card';

/** Ecranele platformei care nu fac obiectul prototipului. */
export function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="mx-auto max-w-[1400px] space-y-5">
      <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      <Card className="px-6 py-12 text-center text-sm text-gray-600">
        Ecran existent în platformă, în afara acestui prototip. Prototipul acoperă modulul „Alocări DEEE" (admin) și
        „Alocări EEE" (client), plus grila „Cantități colectate" care îl alimentează.
      </Card>
    </div>
  );
}
