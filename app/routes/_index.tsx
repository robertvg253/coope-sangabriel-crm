import { type ActionFunctionArgs, type LoaderFunctionArgs, redirect, useActionData } from "react-router";
import { supabaseServer } from "~/supabase/supabaseServer";
import LoginForm from "~/components/LoginForm";

// Función para verificar si el usuario ya está autenticado
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const session = await supabaseServer.auth.getSession();
  
  // Si ya está autenticado, redirigir al leads
  if (session.data.session) {
    throw redirect("/leads");
  }
  
  return null;
}

// Función para manejar el login
export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return {
      error: "Por favor, completa todos los campos"
    };
  }

  try {
    // Intentar autenticar con Supabase
    const { data, error } = await supabaseServer.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Manejar diferentes tipos de errores
      let errorMessage = "Error al iniciar sesión";
      
      if (error.message.includes("Invalid login credentials")) {
        errorMessage = "Credenciales incorrectas. Verifica tu email y contraseña.";
      } else if (error.message.includes("Email not confirmed")) {
        errorMessage = "Por favor, confirma tu email antes de iniciar sesión.";
      } else if (error.message.includes("Too many requests")) {
        errorMessage = "Demasiados intentos. Intenta de nuevo más tarde.";
      } else {
        errorMessage = error.message;
      }

      return {
        error: errorMessage
      };
    }

    if (data.user) {
      // Login exitoso, redirigir al leads
      throw redirect("/leads");
    }

    return {
      error: "Error inesperado al iniciar sesión"
    };

  } catch (error) {
    console.error("Error en autenticación:", error);
    return {
      error: "Error del servidor. Intenta de nuevo más tarde."
    };
  }
}

export default function LoginPage() {
  const actionData = useActionData<{ error?: string }>();
  
  return <LoginForm error={actionData?.error} />;
}
