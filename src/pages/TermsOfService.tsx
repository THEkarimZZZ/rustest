import { Link } from 'react-router-dom'
import { FileText } from 'lucide-react'

function TermsOfService() {
  return (
    <div className="container-narrow py-12 md:py-16">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
            <FileText className="h-6 w-6 text-accent" />
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-semibold text-text-primary mb-3">
            Пользовательское соглашение
          </h1>
          <p className="text-text-secondary">
            Последнее обновление: 11 апреля 2026 г.
          </p>
        </div>

        {/* Content */}
        <div className="bg-bg-card border border-border rounded-xl p-6 md:p-8 space-y-8 text-text-secondary leading-relaxed">
          <section>
            <h2 className="text-xl font-display font-semibold text-text-primary mb-3">
              1. Общие положения
            </h2>
            <p className="mb-3">
              Настоящее Пользовательское соглашение (далее — Соглашение) регулирует отношения между 
              платформой «Проверяй» (далее — Администрация) и пользователем сети Интернет (далее — 
              Пользователь), возникающие при использовании платформы.
            </p>
            <p>
              Использование платформы означает безоговорочное согласие Пользователя с настоящим 
              Соглашением. В случае несогласия с условиями Соглашения Пользователь должен прекратить 
              использование платформы.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold text-text-primary mb-3">
              2. Предмет Соглашения
            </h2>
            <p className="mb-3">2.1. Администрация предоставляет Пользователю право использования платформы в следующих целях:</p>
            <ul className="list-disc list-inside space-y-1.5 ml-2">
              <li>Создание и управление образовательными тестами</li>
              <li>Управление классами и учениками</li>
              <li>Прохождение тестирования (для учеников)</li>
              <li>Анализ результатов тестирования</li>
            </ul>
            <p className="mt-3">
              2.2. Услуги предоставляются на бесплатной основе.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold text-text-primary mb-3">
              3. Регистрация и аккаунт
            </h2>
            <p className="mb-2">3.1. Для получения доступа к функционалу платформы Пользователь обязан пройти регистрацию.</p>
            <p className="mb-2">3.2. При регистрации Пользователь обязуется предоставить достоверную информацию.</p>
            <p className="mb-2">3.3. Пользователь несёт ответственность за:</p>
            <ul className="list-disc list-inside space-y-1.5 ml-2 mb-3">
              <li>Достоверность предоставленных данных</li>
              <li>Сохранность учётных данных (логина и пароля)</li>
              <li>Все действия, совершённые с использованием его аккаунта</li>
            </ul>
            <p>
              3.4. Запрещается передавать свои учётные данные третьим лицам.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold text-text-primary mb-3">
              4. Права и обязанности сторон
            </h2>
            <p className="mb-2">4.1. Администрация вправе:</p>
            <ul className="list-disc list-inside space-y-1.5 ml-2 mb-3">
              <li>Изменять правила работы платформы</li>
              <li>Ограничить доступ Пользователя при нарушении условий Соглашения</li>
              <li>Удалять контент, нарушающий законодательство РФ</li>
            </ul>
            <p className="mb-2">4.2. Пользователь обязуется:</p>
            <ul className="list-disc list-inside space-y-1.5 ml-2">
              <li>Не нарушать работоспособность платформы</li>
              <li>Не использовать платформу в целях, противоречащих законодательству РФ</li>
              <li>Не предпринимать действий, которые могут навредить другим пользователям</li>
              <li>Соблюдать академическую честность при прохождении тестов</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold text-text-primary mb-3">
              5. Интеллектуальная собственность
            </h2>
            <p>
              Все материалы, размещённые на платформе, являются объектами исключительных прав 
              Администрации и других правообладателей. Использование материалов без предварительного 
              согласия правообладателей не допускается.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold text-text-primary mb-3">
              6. Персональные данные
            </h2>
            <p>
              Обработка персональных данных осуществляется в соответствии с Федеральным законом от 
              27.07.2006 № 152-ФЗ «О персональных данных» и{' '}
              <Link to="/privacy-policy" className="text-cta hover:text-cta-hover font-medium transition-colors">
                Политикой конфиденциальности
              </Link>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold text-text-primary mb-3">
              7. Контакты
            </h2>
            <p>
              По вопросам, связанным с условиями Соглашения:{' '}
              <a href="mailto:support@rustest.ru" className="text-cta hover:text-cta-hover font-medium transition-colors">
                support@rustest.ru
              </a>
            </p>
          </section>
        </div>

        {/* Back Link */}
        <div className="mt-8">
          <Link 
            to="/register" 
            className="text-cta hover:text-cta-hover font-medium transition-colors inline-flex items-center gap-1"
          >
            ← Вернуться к регистрации
          </Link>
        </div>
      </div>
    </div>
  )
}

export default TermsOfService
