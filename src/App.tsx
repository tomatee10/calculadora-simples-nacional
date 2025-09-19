import { AlertTriangle, Calculator, DollarSign, Info } from 'lucide-react'
import './App.css'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card'
import { Alert, AlertDescription } from './components/ui/alert'
import { Label } from './components/ui/label'
import { Input } from './components/ui/input'
import { Button } from './components/ui/button'
import { useState } from 'react'

interface Faixa {
  limite: number
  aliquota: number
  deduzir: number
}

// Tipagem dos anexos
type Anexos = Record<string, Faixa[]>

const anexos: Anexos = {
  "Anexo I (Comércio)": [
    { limite: 180000.0, aliquota: 0.04, deduzir: 0.0 },
    { limite: 360000.0, aliquota: 0.073, deduzir: 5940.0 },
    { limite: 720000.0, aliquota: 0.095, deduzir: 13860.0 },
    { limite: 1800000.0, aliquota: 0.107, deduzir: 22500.0 },
    { limite: 3600000.0, aliquota: 0.143, deduzir: 87300.0 },
    { limite: 4800000.0, aliquota: 0.19, deduzir: 378000.0 },
  ],
  "Anexo II (Indústria e Equiparados)": [
    { limite: 180000.0, aliquota: 0.045, deduzir: 0.0 },
    { limite: 360000.0, aliquota: 0.078, deduzir: 5940.0 },
    { limite: 720000.0, aliquota: 0.1, deduzir: 13860.0 },
    { limite: 1800000.0, aliquota: 0.112, deduzir: 22500.0 },
    { limite: 3600000.0, aliquota: 0.147, deduzir: 85500.0 },
    { limite: 4800000.0, aliquota: 0.3, deduzir: 720000.0 },
  ],
  "Anexo III (Serviços - Locação de Bens Móveis)": [
    { limite: 180000.0, aliquota: 0.06, deduzir: 0.0 },
    { limite: 360000.0, aliquota: 0.112, deduzir: 9360.0 },
    { limite: 720000.0, aliquota: 0.135, deduzir: 17640.0 },
    { limite: 1800000.0, aliquota: 0.16, deduzir: 35640.0 },
    { limite: 3600000.0, aliquota: 0.21, deduzir: 125640.0 },
    { limite: 4800000.0, aliquota: 0.33, deduzir: 648000.0 },
  ],
  "Anexo IV (Serviços - Limpeza, Vigilância)": [
    { limite: 180000.0, aliquota: 0.045, deduzir: 0.0 },
    { limite: 360000.0, aliquota: 0.09, deduzir: 8100.0 },
    { limite: 720000.0, aliquota: 0.102, deduzir: 12420.0 },
    { limite: 1800000.0, aliquota: 0.14, deduzir: 39780.0 },
    { limite: 3600000.0, aliquota: 0.22, deduzir: 183780.0 },
    { limite: 4800000.0, aliquota: 0.33, deduzir: 828000.0 },
  ],
  "Anexo V (Serviços Profissionais)": [
    { limite: 180000.0, aliquota: 0.155, deduzir: 0.0 },
    { limite: 360000.0, aliquota: 0.18, deduzir: 4500.0 },
    { limite: 720000.0, aliquota: 0.195, deduzir: 9900.0 },
    { limite: 1800000.0, aliquota: 0.205, deduzir: 17100.0 },
    { limite: 3600000.0, aliquota: 0.23, deduzir: 62100.0 },
    { limite: 4800000.0, aliquota: 0.305, deduzir: 540000.0 },
  ],
}

// Tipagem dos cálculos realizados
interface CalculoOk {
  anexo: string
  faixaDescricao: string
  aliquotaNominal: number
  parcelaADeduzir: number
  aliquotaEfetiva: number
  impostoDevido: number
  erro?: never
}

interface CalculoErro {
  anexo: string
  erro: string
}

type Calculo = CalculoOk | CalculoErro

// Tipagem do estado de resultados
interface Resultados {
  faturamento: number
  receita12: number
  calculos: Calculo[]
}

export function App() {
  const [faturamentoMes, setFaturamentoMes] = useState<string>('')
  const [rbt12, setRbt12] = useState<string>('')
  const [resultados, setResultados] = useState<Resultados | null>(null)
  const [erro, setErro] = useState<string>('')

  const formatarValor = (valor: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor)
  }

  const formatarPercentual = (valor: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'percent',
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    }).format(valor)
  }

  const calcularSimples = (): void => {
    setErro('')
    setResultados(null)

    const faturamento = parseFloat(faturamentoMes.replace(',', '.'))
    const receita12 = parseFloat(rbt12.replace(',', '.'))

    if (isNaN(faturamento) || isNaN(receita12) || faturamento < 0 || receita12 < 0) {
      setErro('Por favor, digite valores numéricos válidos e positivos.')
      return
    }

    if (receita12 > 4800000.0) {
      setErro(
        'RBT12 excede o limite do Simples Nacional (R$ 4.800.000,00). A empresa deve migrar para outro regime tributário.'
      )
      return
    }

    const resultadosCalculados: Calculo[] = []

    Object.entries(anexos).forEach(([nomeAnexo, tabelaAnexo]) => {
      let encontrouFaixa = false

      for (let i = 0; i < tabelaAnexo.length; i++) {
        const faixa = tabelaAnexo[i]

        if (receita12 <= faixa.limite) {
          let faixaDescricao: string
          if (i === 0) {
            faixaDescricao = `até ${formatarValor(faixa.limite)}`
          } else {
            const faixaAnterior = tabelaAnexo[i - 1].limite
            faixaDescricao = `de ${formatarValor(faixaAnterior + 0.01)} até ${formatarValor(faixa.limite)}`
          }

          const aliquotaNominal = faixa.aliquota
          const parcelaADeduzir = faixa.deduzir

          let aliquotaEfetiva: number
          if (receita12 > 0) {
            aliquotaEfetiva = ((receita12 * aliquotaNominal) - parcelaADeduzir) / receita12
          } else {
            aliquotaEfetiva = aliquotaNominal
          }

          aliquotaEfetiva = Math.max(0, aliquotaEfetiva)

          const impostoDevido = faturamento * aliquotaEfetiva

          resultadosCalculados.push({
            anexo: nomeAnexo,
            faixaDescricao,
            aliquotaNominal,
            parcelaADeduzir,
            aliquotaEfetiva,
            impostoDevido,
          })

          encontrouFaixa = true
          break
        }
      }

      if (!encontrouFaixa) {
        resultadosCalculados.push({
          anexo: nomeAnexo,
          erro: 'RBT12 excede todas as faixas deste anexo',
        })
      }
    })

    setResultados({
      faturamento,
      receita12,
      calculos: resultadosCalculados,
    })
  }

  return (
    <div className="w-screen min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Calculator className="h-10 w-10 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">
              Calculadora Simples Nacional
            </h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Simule o cálculo do DAS para todos os anexos do Simples Nacional.
            Esta ferramenta é para fins de estudo e não substitui um software contábil oficial.
          </p>
        </div>

        {/* Formulário de entrada */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Dados para Cálculo
            </CardTitle>
            <CardDescription>
              Informe o faturamento do mês e a receita bruta dos últimos 12 meses
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="faturamento">Faturamento Bruto do Mês (R$)</Label>
                <Input
                  id="faturamento"
                  type="text"
                  placeholder="Ex: 50000,00"
                  value={faturamentoMes}
                  onChange={(e) => setFaturamentoMes(e.target.value)}
                  className="text-lg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rbt12">Receita Bruta dos Últimos 12 Meses - RBT12 (R$)</Label>
                <Input
                  id="rbt12"
                  type="text"
                  placeholder="Ex: 450000,00"
                  value={rbt12}
                  onChange={(e) => setRbt12(e.target.value)}
                  className="text-lg"
                />
              </div>
            </div>

            <Button
              onClick={calcularSimples}
              className="w-full md:w-auto text-lg px-8 py-3"
              size="lg"
            >
              <Calculator className="mr-2 h-5 w-5" />
              Calcular DAS
            </Button>

            {erro && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{erro}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Resultados */}
        {resultados && (
          <div className="space-y-6">
            {/* Resumo */}
            <Card>
              <CardHeader>
                <CardTitle>Resumo dos Dados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Faturamento do Mês</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatarValor(resultados.faturamento)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">RBT12 (Base de Cálculo)</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatarValor(resultados.receita12)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Resultados por anexo */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {resultados.calculos.map((calculo: CalculoOk | CalculoErro, index: number) => (
                <Card key={index} className="h-fit">
                  <CardHeader>
                    <CardTitle className="text-lg">{calculo.anexo}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {"erro" in calculo ? (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>{calculo.erro}</AlertDescription>
                      </Alert>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-gray-600">Faixa de Enquadramento (RBT12)</p>
                          <p className="font-medium">{calculo.faixaDescricao}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Alíquota Nominal</p>
                            <p className="font-medium">{formatarPercentual(calculo.aliquotaNominal)}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Parcela a Deduzir</p>
                            <p className="font-medium">{formatarValor(calculo.parcelaADeduzir)}</p>
                          </div>
                        </div>

                        <div>
                          <p className="text-sm text-gray-600">Alíquota Efetiva Calculada</p>
                          <p className="text-lg font-bold text-blue-600">
                            {formatarPercentual(calculo.aliquotaEfetiva)}
                          </p>
                        </div>

                        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                          <p className="text-sm text-green-700 font-medium">💰 Valor do DAS a Pagar</p>
                          <p className="text-2xl font-bold text-green-800">
                            {formatarValor(calculo.impostoDevido)}
                          </p>
                        </div>

                        {/* Observações especiais */}
                        {calculo.anexo.includes("Anexo IV") && (
                          <Alert>
                            <Info className="h-4 w-4" />
                            <AlertDescription>
                              INSS Patronal não incluído (pago separadamente)
                            </AlertDescription>
                          </Alert>
                        )}

                        {calculo.anexo.includes("Anexo V") && (
                          <Alert>
                            <Info className="h-4 w-4" />
                            <AlertDescription>
                              Para serviços profissionais sem folha de pagamento.
                              Com folha de pagamento, o cálculo pode ser diferente.
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>


            {/* Avisos importantes */}
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>IMPORTANTE:</strong> Este cálculo é uma simulação para fins educativos.
                Consulte sempre um contador qualificado e utilize software contábil certificado
                para cálculos oficiais. Verifique se sua atividade se enquadra no anexo correto
                e fique atento às atualizações da legislação.
              </AlertDescription>
            </Alert>
          </div>
        )}
      </div>
    </div>
  )
}


