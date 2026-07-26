import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer, Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer'
import { createClient } from '@/lib/supabase/server'

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 10, fontFamily: 'Helvetica', color: '#1C1F26' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  logo: { width: 90, height: 45, objectFit: 'contain' },
  companyBlock: { textAlign: 'right' },
  title: { fontSize: 16, fontWeight: 700, marginBottom: 2, color: '#164394' },
  section: { marginBottom: 16 },
  label: { color: '#6B7280', fontSize: 9 },
  table: { marginTop: 8, borderTop: '1pt solid #E5E7EB' },
  row: { flexDirection: 'row', borderBottom: '1pt solid #E5E7EB', paddingVertical: 6 },
  headerRow: { flexDirection: 'row', paddingVertical: 6, backgroundColor: '#F3F4F6' },
  colDesc: { flex: 4 },
  colQty: { flex: 1, textAlign: 'right' },
  colUnit: { flex: 1, textAlign: 'right' },
  signaturesRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 48 },
  sigBlock: { width: '45%', alignItems: 'center' },
  sigImg: { width: 140, height: 60, objectFit: 'contain', marginBottom: 4 },
  sigLine: { borderTop: '1pt solid #1C1F26', width: '100%', marginTop: 4, paddingTop: 4, textAlign: 'center' },
})

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: albaran, error } = await supabase
    .from('albaranes')
    .select('*, companies(*), albaran_items(*)')
    .eq('id', id)
    .single()

  if (error || !albaran) {
    return NextResponse.json({ error: 'Albarán no encontrado' }, { status: 404 })
  }

  const company = albaran.companies
  const items = (albaran.albaran_items || []).sort((a: { orden: number }, b: { orden: number }) => a.orden - b.orden)

  const doc = (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          {company?.logo_url ? (
            // eslint-disable-next-line jsx-a11y/alt-text
            <Image src={company.logo_url} style={styles.logo} />
          ) : (
            <Text style={styles.title}>{company?.name}</Text>
          )}
          <View style={styles.companyBlock}>
            <Text>{company?.name}</Text>
            <Text style={styles.label}>{company?.tax_id}</Text>
            <Text style={styles.label}>{company?.address}, {company?.city}</Text>
            <Text style={styles.label}>{company?.phone} · {company?.email}</Text>
          </View>
        </View>

        <Text style={styles.title}>Albarán de entrega nº {albaran.numero}</Text>
        <Text style={styles.label}>Fecha: {albaran.fecha}</Text>

        <View style={[styles.section, { marginTop: 16 }]}>
          <Text style={styles.label}>Cliente</Text>
          <Text>{albaran.client_name_snapshot}</Text>
          {albaran.client_tax_id_snapshot && <Text style={styles.label}>{albaran.client_tax_id_snapshot}</Text>}
          {albaran.client_address_snapshot && <Text style={styles.label}>{albaran.client_address_snapshot}</Text>}
        </View>

        <View style={styles.table}>
          <View style={styles.headerRow}>
            <Text style={styles.colDesc}>Descripción</Text>
            <Text style={styles.colQty}>Cantidad</Text>
            <Text style={styles.colUnit}>Unidad</Text>
          </View>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {items.map((it: any) => (
            <View key={it.id} style={styles.row}>
              <Text style={styles.colDesc}>{it.descripcion}</Text>
              <Text style={styles.colQty}>{it.cantidad}</Text>
              <Text style={styles.colUnit}>{it.unidad}</Text>
            </View>
          ))}
        </View>

        {albaran.notas && (
          <View style={{ marginTop: 12 }}>
            <Text style={styles.label}>Notas</Text>
            <Text>{albaran.notas}</Text>
          </View>
        )}

        <View style={styles.signaturesRow}>
          <View style={styles.sigBlock}>
            {company?.signature_url && (
              // eslint-disable-next-line jsx-a11y/alt-text
              <Image src={company.signature_url} style={styles.sigImg} />
            )}
            <Text style={styles.sigLine}>Firma de la empresa · {company?.name}</Text>
          </View>
          <View style={styles.sigBlock}>
            {albaran.client_signature_url && (
              // eslint-disable-next-line jsx-a11y/alt-text
              <Image src={albaran.client_signature_url} style={styles.sigImg} />
            )}
            <Text style={styles.sigLine}>
              Firma del cliente/encargado{albaran.client_signature_name ? ` · ${albaran.client_signature_name}` : ''}
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  )

  const buffer = await renderToBuffer(doc)

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="albaran-${albaran.numero}.pdf"`,
    },
  })
}
