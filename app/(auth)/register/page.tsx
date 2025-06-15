export default function RegisterPage() {
  return (
    <div>
      <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
        Crie sua conta
      </h2>
      <p className="mt-2 text-center text-sm text-gray-600">
        Já tem uma conta?{' '}
        <a href="/login" className="font-medium text-primary-600 hover:text-primary-500">
          Faça login
        </a>
      </p>
      {/* Register form will be implemented here */}
    </div>
  )
}