import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth';
import { IoTSecurityDashboard } from '@/components/iot/IoTSecurityDashboard';

export const dynamic = 'force-dynamic';

export default async function IoTSecurityPage() {
  const session = await getServerSession();
  if (!session) {
    redirect('/iot-login');
  }

  return <IoTSecurityDashboard />;
}
