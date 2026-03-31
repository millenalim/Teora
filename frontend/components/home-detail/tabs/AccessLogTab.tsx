import type { AccessLog, User } from "@/app/generated/prisma/client"

type AccessLogWithUser = AccessLog & { user: { id: number; username: string; fullName: string } }

const ENTITY_LABEL: Record<string, string> = {
  lock_code: "Lock Code",
  wifi_password: "Wi-Fi Password",
}

export default function AccessLogTab({ logs }: { logs: AccessLogWithUser[] }) {
  if (logs.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-12">No access events recorded</p>
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-2.5">User</th>
            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-2.5">What</th>
            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-2.5">When</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {logs.map((log) => (
            <tr key={log.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-sm font-medium text-gray-900">
                {log.user.fullName || log.user.username}
              </td>
              <td className="px-4 py-3 text-sm text-gray-600">
                Revealed {ENTITY_LABEL[log.entityType] ?? log.entityType} #{log.entityId}
              </td>
              <td className="px-4 py-3 text-sm text-gray-500">
                {new Date(log.accessedAt).toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
