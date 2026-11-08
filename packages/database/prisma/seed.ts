import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // ── Plans ──────────────────────────────────────────────────────────────────
  const plans = [
    {
      id: 'plan_free',
      name: 'FREE',
      displayName: 'Gratuit',
      price: 0,
      credits: 0,
      features: [
        '100 recherches par jour',
        'Acces complet a l\'ADW API',
        'Tous les champs de recherche',
        'Export JSON, TXT, PDF',
        'Historique de recherche',
        'Support par email',
      ],
      stripePriceId: null,
      isActive: true,
    },
    {
      id: 'plan_basic',
      name: 'BASIC',
      displayName: 'Basic',
      price: 0,
      credits: 0,
      features: [
        '100 recherches par jour',
        'Acces complet a l\'ADW API',
        'Tous les champs de recherche',
        'Export JSON, TXT, PDF',
        'Historique de recherche',
        'Support prioritaire',
        'Acces API',
      ],
      stripePriceId: null,
      isActive: true,
    },
    {
      id: 'plan_premium',
      name: 'PREMIUM',
      displayName: 'Premium',
      price: 0,
      credits: 0,
      features: [
        '100 recherches par jour',
        'Acces complet a l\'ADW API',
        'Tous les champs de recherche',
        'Export JSON, TXT, PDF',
        'Historique de recherche',
        'Support 24/7',
        'Acces API prioritaire',
        'Analytics avances',
      ],
      stripePriceId: null,
      isActive: true,
    },
    {
      id: 'plan_business',
      name: 'BUSINESS',
      displayName: 'Business',
      price: 0,
      credits: 0,
      features: [
        '100 recherches par jour',
        'Acces complet a l\'ADW API',
        'Tous les champs de recherche',
        'Export JSON, TXT, PDF',
        'Historique de recherche',
        'Support dedie 24/7',
        'Acces API illimite',
        'SLA garanti',
        'Facturation entreprise',
      ],
      stripePriceId: null,
      isActive: true,
    },
  ]

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { id: plan.id },
      update: plan,
      create: plan,
    })
    console.log(`  Plan ${plan.displayName} OK`)
  }

  // ── Default system settings ────────────────────────────────────────────────
  const settings = [
    {
      key: 'MAINTENANCE_MESSAGE',
      value: 'La plateforme est en maintenance. Veuillez reessayer dans quelques minutes.',
    },
    { key: 'MAX_API_KEYS_PER_USER', value: '10' },
    { key: 'REGISTRATION_ENABLED', value: 'true' },
    { key: 'SEARCHES_PER_DAY_DEFAULT', value: '100' },
    { key: 'SUPPORT_EMAIL', value: 'adw0000@proton.me' },
    { key: 'SITE_NAME', value: 'ADW Searcher' },
    { key: 'VERSION_MODE', value: 'waiting' },
  ]

  for (const { key, value } of settings) {
    await prisma.systemSetting.upsert({
      where: { key },
      update: {},
      create: { key, value },
    })
    console.log(`  Setting ${key} OK`)
  }

  console.log('\nSeed complete')
  console.log('\nNote: Pour creer le compte owner, inscrivez-vous avec adw0000@proton.me')
  console.log('puis eleviez le role a OWNER via Prisma Studio ou SQL:')
  console.log("  UPDATE \"User\" SET role = 'OWNER' WHERE email = 'adw0000@proton.me';")
}

main()
  .catch(e => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
