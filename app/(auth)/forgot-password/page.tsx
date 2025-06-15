export default function ForgotPasswordPage() {
  return (
    <div>
      <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
        Recuperar senha
      </h2>
      <p className="mt-2 text-center text-sm text-gray-600">
        Lembrou sua senha?{' '}
        <a href="/login" className="font-medium text-primary-600 hover:text-primary-500">
          Voltar ao login
        </a>
      </p>
      {/* Password recovery form will be implemented here */}
    </div>
  )
}