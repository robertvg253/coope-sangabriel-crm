import { useFetcher } from "react-router";

interface LoginFormProps {
  error?: string;
}

export default function LoginForm({ error }: LoginFormProps) {
  const fetcher = useFetcher();
  const isSubmitting = fetcher.state === "submitting";

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Tarjeta del formulario */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
          {/* Header */}
          <div className="text-center mb-8">
            {/* Logo */}
            <div className="flex justify-center mb-4">
              <img 
                src="/cropped-csg-logo-1.png" 
                alt="Coope San Gabriel R.L." 
                className="w-12 h-12 object-contain"
              />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Panel de informes
              <br />
              COOPE SAN GABRIEL
            </h1>
            <p className="text-gray-600">
              Inicia sesión para acceder al panel de control
            </p>
          </div>

          {/* Formulario */}
          <fetcher.Form 
            method="post" 
            className="space-y-6"
          >
            {/* Campo Email */}
            <div>
              <label 
                htmlFor="email" 
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
                placeholder="tu@email.com"
                disabled={isSubmitting}
              />
            </div>

            {/* Campo Password */}
            <div>
              <label 
                htmlFor="password" 
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Contraseña
              </label>
              <input
                type="password"
                id="password"
                name="password"
                required
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
                placeholder="••••••••"
                disabled={isSubmitting}
              />
            </div>

            {/* Mensaje de error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* Botón de envío */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Iniciando sesión...
                </div>
              ) : (
                "Iniciar Sesión"
              )}
            </button>
          </fetcher.Form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-gray-500 text-sm">
              Panel de informes de contactos de COOPE SAN GABRIEL
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
