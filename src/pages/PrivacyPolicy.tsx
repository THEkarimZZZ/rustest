import { Link } from 'react-router-dom'
import { Shield } from 'lucide-react'

function PrivacyPolicy() {
  return (
    <div className="container-narrow py-12 md:py-16">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
            <Shield className="h-6 w-6 text-accent" />
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-semibold text-text-primary mb-3">
            Политика конфиденциальности
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
              Настоящая Политика конфиденциальности разработана в соответствии с Федеральным законом 
              от 27.07.2006 № 152-ФЗ «О персональных данных» и определяет порядок обработки персональных 
              данных и меры по обеспечению безопасности персональных данных, предпринимаемые платформой 
              «Проверяй» (далее — Оператор).
            </p>
            <p>
              Оператор ставит своей важнейшей целью и условием осуществления своей деятельности соблюдение 
              прав и свобод человека и гражданина при обработке его персональных данных, в том числе защиту 
              прав на неприкосновенность частной жизни, личную и семейную тайну.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold text-text-primary mb-3">
              2. Персональные данные
            </h2>
            <p className="mb-3">Оператор может обрабатывать следующие персональные данные Пользователя:</p>
            <ul className="list-disc list-inside space-y-1.5 ml-2">
              <li>Фамилия, имя, отчество</li>
              <li>Адрес электронной почты</li>
              <li>Роль в системе (преподаватель/ученик)</li>
              <li>Дата и время регистрации</li>
              <li>Результаты тестирования</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold text-text-primary mb-3">
              3. Цели обработки
            </h2>
            <ul className="list-disc list-inside space-y-1.5 ml-2">
              <li>Идентификация пользователя при регистрации и авторизации</li>
              <li>Предоставление доступа к функционалу платформы</li>
              <li>Создание и управление классами, тестами</li>
              <li>Проведение тестирования и анализ результатов</li>
              <li>Улучшение качества обслуживания</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold text-text-primary mb-3">
              4. Защита данных
            </h2>
            <p>
              Оператор обеспечивает сохранность персональных данных и принимает все возможные меры, 
              исключающие доступ неуполномоченных лиц к персональным данным. Персональные данные 
              хранятся на защищённых серверах с использованием современных средств криптографической 
              защиты информации.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold text-text-primary mb-3">
              5. Права пользователя
            </h2>
            <p className="mb-2">Пользователь имеет право:</p>
            <ul className="list-disc list-inside space-y-1.5 ml-2">
              <li>Получать информацию, касающуюся обработки его персональных данных</li>
              <li>Требовать уточнения своих персональных данных, их блокирования или уничтожения</li>
              <li>Отозвать согласие на обработку персональных данных</li>
              <li>Обжаловать действия или бездействие Оператора в уполномоченном органе</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold text-text-primary mb-3">
              6. Контакты
            </h2>
            <p>
              По вопросам обработки персональных данных:{' '}
              <a href="mailto:privacy@rustest.ru" className="text-cta hover:text-cta-hover font-medium transition-colors">
                privacy@rustest.ru
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

export default PrivacyPolicy
