const PORT_SERVICES: Record<number, string> = {
  20: 'FTP-DATA',
  21: 'FTP',
  22: 'SSH',
  23: 'TELNET',
  25: 'SMTP',
  53: 'DNS',
  67: 'DHCP',
  68: 'DHCP',
  80: 'HTTP',
  110: 'POP3',
  123: 'NTP',
  143: 'IMAP',
  161: 'SNMP',
  389: 'LDAP',
  443: 'HTTPS',
  445: 'SMB',
  465: 'SMTPS',
  587: 'SMTP Submission',
  853: 'DNS-over-TLS',
  993: 'IMAPS',
  995: 'POP3S',
  1433: 'MSSQL',
  1521: 'Oracle',
  3306: 'MySQL',
  3389: 'RDP',
  5432: 'PostgreSQL',
  6379: 'Redis',
  8080: 'HTTP-ALT',
  8443: 'HTTPS-ALT',
  9000: 'APP'
};

export function inferService(srcPort?: number, dstPort?: number): string | undefined {
  if (dstPort && PORT_SERVICES[dstPort]) return PORT_SERVICES[dstPort];
  if (srcPort && PORT_SERVICES[srcPort]) return PORT_SERVICES[srcPort];
  return undefined;
}
