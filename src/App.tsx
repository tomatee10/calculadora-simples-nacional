import { useState } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Alert, AlertDescription } from '@/components/ui/alert.jsx'
import { Checkbox } from '@/components/ui/checkbox.jsx'
import { Calculator, DollarSign, AlertTriangle, Info, Users, TrendingUp } from 'lucide-react'
import './App.css'

// Tabelas do Simples Nacional 2024/2025
const anexos = {
  "Anexo I (Comércio)": [
    { limite: 180000.00, aliquota: 0.040, deduzir: 0.00 },
    { limite: 360000.00, aliquota: 0.073, deduzir: 5940.00 },
    { limite: 720000.00, aliquota: 0.095, deduzir: 13860.00 },
    { limite: 1800000.00, aliquota: 0.107, deduzir: 22500.00 },
    { limite: 3600000.00, aliquota: 0.143, deduzir: 87300.00 },
    { limite: 4800000.00, aliquota: 0.190, deduzir: 378000.00 }
  ],
  "Anexo II (Indústria e Equiparados)": [
    { limite: 180000.00, aliquota: 0.045, deduzir: 0.00 },
    { limite: 360000.00, aliquota: 0.078, deduzir: 5940.00 },
    { limite: 720000.00, aliquota: 0.100, deduzir: 13860.00 },
    { limite: 1800000.00, aliquota: 0.112, deduzir: 22500.00 },
    { limite: 3600000.00, aliquota: 0.147, deduzir: 85500.00 },
    { limite: 4800000.00, aliquota: 0.300, deduzir: 720000.00 }
  ],
  "Anexo III (Serviços - Locação de Bens Móveis)": [
    { limite: 180000.00, aliquota: 0.060, deduzir: 0.00 },
    { limite: 360000.00, aliquota: 0.112, deduzir: 9360.00 },
    { limite: 720000.00, aliquota: 0.135, deduzir: 17640.00 },
    { limite: 1800000.00, aliquota: 0.160, deduzir: 35640.00 },
    { limite: 3600000.00, aliquota: 0.210, deduzir: 125640.00 },
    { limite: 4800000.00, aliquota: 0.330, deduzir: 648000.00 }
  ],
  "Anexo IV (Serviços - Limpeza, Vigilância)": [
    { limite: 180000.00, aliquota: 0.045, deduzir: 0.00 },
    { limite: 360000.00, aliquota: 0.090, deduzir: 8100.00 },
    { limite: 720000.00, aliquota: 0.102, deduzir: 12420.00 },
    { limite: 1800000.00, aliquota: 0.140, deduzir: 39780.00 },
    { limite: 3600000.00, aliquota: 0.220, deduzir: 183780.00 },
    { limite: 4800000.00, aliquota: 0.330, deduzir: 828000.00 }
  ],
  "Anexo V (Serviços Profissionais)": [
    { limite: 180000.00, aliquota: 0.155, deduzir: 0.00 },
    { limite: 360000.00, aliquota: 0.180, deduzir: 4500.00 },
    { limite: 720000.00, aliquota: 0.195, deduzir: 9900.00 },
    { limite: 1800000.00, aliquota: 0.205, deduzir: 17100.00 },
    { limite: 3600000.00, aliquota: 0.230, deduzir: 62100.00 },
    { limite: 4800000.00, aliquota: 0.305, deduzir: 540000.00 }
  ]
}

function App() {
  const [faturamentoMes, setFaturamentoMes] = useState('')
  const [rbt12, setRbt12] = useState('')
  const [folhaPagamento12, setFolhaPagamento12] = useState('')
  const [aplicarFatorR, setAplicarFatorR] = useState(false)
  const [resultados, setResultados] = useState(null)
  const [erro, setErro] = useState('')

  const formatarValor = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor)
  }

  const formatarPercentual = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'percent',
      minimumFractionDigits: 4,
      maximumFractionDigits: 4
    }).format(valor)
  }

  const calcularFatorR = (folha12, receita12) => {
    if (folha12 <= 0 || receita12 <= 0) return 0
    return folha12 / receita12
  }

  const calcularAnexo = (nomeAnexo, tabelaAnexo, faturamento, receita12) => {
    for (let i = 0; i < tabelaAnexo.length; i++) {
      const faixa = tabelaAnexo[i]
      
      if (receita12 <= faixa.limite) {
        // Definir descrição da faixa
        let faixaDescricao
        if (i === 0) {
          faixaDescricao = `até ${formatarValor(faixa.limite)}`
        } else {
          const faixaAnterior = tabelaAnexo[i-1].limite
          faixaDescricao = `de ${formatarValor(faixaAnterior + 0.01)} até ${formatarValor(faixa.limite)}`
        }

        // Cálculo da alíquota efetiva e imposto devido
        const aliquotaNominal = faixa.aliquota
        const parcelaADeduzir = faixa.deduzir

        let aliquotaEfetiva
        if (receita12 > 0) {
          aliquotaEfetiva = ((receita12 * aliquotaNominal) - parcelaADeduzir) / receita12
        } else {
          aliquotaEfetiva = aliquotaNominal
        }

        // Garantir que a alíquota efetiva não seja negativa
        aliquotaEfetiva = Math.max(0, aliquotaEfetiva)

        const impostoDevido = faturamento * aliquotaEfetiva

        return {
          anexo: nomeAnexo,
          faixaDescricao,
          aliquotaNominal,
          parcelaADeduzir,
          aliquotaEfetiva,
          impostoDevido
        }
      }
    }

    return {
      anexo: nomeAnexo,
      erro: 'RBT12 excede todas as faixas deste anexo'
    }
  }

  const calcularSimples = () => {
    setErro('')
    setResultados(null)

    // Validação de entrada
    const faturamento = parseFloat(faturamentoMes.replace(',', '.'))
    const receita12 = parseFloat(rbt12.replace(',', '.'))

    if (isNaN(faturamento) || isNaN(receita12) || faturamento < 0 || receita12 < 0) {
      setErro('Por favor, digite valores numéricos válidos e positivos para faturamento e RBT12.')
      return
    }

    if (receita12 > 4800000.00) {
      setErro('RBT12 excede o limite do Simples Nacional (R$ 4.800.000,00). A empresa deve migrar para outro regime tributário.')
      return
    }

    // Validação do Fator R se aplicável
    let fatorR = null
    let folha12 = 0
    if (aplicarFatorR) {
      folha12 = parseFloat(folhaPagamento12.replace(',', '.'))
      if (isNaN(folha12) || folha12 < 0) {
        setErro('Por favor, digite um valor válido e positivo para a folha de pagamento.')
        return
      }
      fatorR = calcularFatorR(folha12, receita12)
    }

    // Calcular para todos os anexos
    const resultadosCalculados = []

    Object.entries(anexos).forEach(([nomeAnexo, tabelaAnexo]) => {
      // Para Anexo III e V, aplicar lógica do Fator R se habilitado
      if (aplicarFatorR && (nomeAnexo.includes('Anexo III') || nomeAnexo.includes('Anexo V'))) {
        if (nomeAnexo.includes('Anexo III') && fatorR >= 0.28) {
          // Pode usar Anexo III
          const resultado = calcularAnexo(nomeAnexo + ' (Fator R ≥ 28%)', tabelaAnexo, faturamento, receita12)
          resultado.fatorRApplicado = true
          resultado.fatorRValor = fatorR
          resultado.recomendado = true
          resultadosCalculados.push(resultado)
        } else if (nomeAnexo.includes('Anexo V') && fatorR < 0.28) {
          // Deve usar Anexo V
          const resultado = calcularAnexo(nomeAnexo + ' (Fator R < 28%)', tabelaAnexo, faturamento, receita12)
          resultado.fatorRApplicado = true
          resultado.fatorRValor = fatorR
          resultado.recomendado = true
          resultadosCalculados.push(resultado)
        } else if (nomeAnexo.includes('Anexo III') && fatorR < 0.28) {
          // Não pode usar Anexo III
          resultadosCalculados.push({
            anexo: nomeAnexo + ' (Fator R < 28%)',
            erro: 'Não pode usar este anexo devido ao Fator R ser menor que 28%',
            fatorRApplicado: true,
            fatorRValor: fatorR
          })
        } else if (nomeAnexo.includes('Anexo V') && fatorR >= 0.28) {
          // Pode usar Anexo V, mas Anexo III seria melhor
          const resultado = calcularAnexo(nomeAnexo + ' (Fator R ≥ 28%)', tabelaAnexo, faturamento, receita12)
          resultado.fatorRApplicado = true
          resultado.fatorRValor = fatorR
          resultado.recomendado = false
          resultado.observacao = 'Anexo III seria mais vantajoso'
          resultadosCalculados.push(resultado)
        }
      } else {
        // Cálculo normal para outros anexos
        const resultado = calcularAnexo(nomeAnexo, tabelaAnexo, faturamento, receita12)
        resultadosCalculados.push(resultado)
      }
    })

    setResultados({
      faturamento,
      receita12,
      folhaPagamento12: folha12,
      fatorR,
      aplicarFatorR,
      calculos: resultadosCalculados
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
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
            Simule o cálculo do DAS para todos os anexos do Simples Nacional com suporte ao Fator R. 
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

            {/* Seção do Fator R */}
            <div className="border-t pt-6">
              <div className="flex items-center space-x-2 mb-4">
                <Checkbox 
                  id="fator-r" 
                  checked={aplicarFatorR}
                  onCheckedChange={setAplicarFatorR}
                />
                <Label htmlFor="fator-r" className="flex items-center gap-2 text-base font-medium">
                  <TrendingUp className="h-4 w-4" />
                  Aplicar cálculo do Fator R (para empresas de serviços)
                </Label>
              </div>
              
              {aplicarFatorR && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="folha-pagamento" className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Folha de Pagamento dos Últimos 12 Meses (R$)
                      </Label>
                      <Input
                        id="folha-pagamento"
                        type="text"
                        placeholder="Ex: 120000,00"
                        value={folhaPagamento12}
                        onChange={(e) => setFolhaPagamento12(e.target.value)}
                        className="text-lg mt-2"
                      />
                      <p className="text-sm text-gray-600 mt-1">
                        Inclua salários, 13º, férias, encargos sociais (INSS, FGTS) e outras remunerações trabalhistas
                      </p>
                    </div>
                    
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Fator R:</strong> Se ≥ 28%, pode usar Anexo III (alíquotas menores). 
                        Se &lt; 28%, deve usar Anexo V (alíquotas maiores).
                      </AlertDescription>
                    </Alert>
                  </div>
                </div>
              )}
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  {resultados.aplicarFatorR && (
                    <div>
                      <p className="text-sm text-gray-600">Fator R Calculado</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {formatarPercentual(resultados.fatorR)}
                      </p>
                      <p className="text-sm text-gray-500">
                        Folha: {formatarValor(resultados.folhaPagamento12)}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Resultados por anexo */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {resultados.calculos.map((calculo, index) => (
                <Card key={index} className={`h-fit ${calculo.recomendado ? 'ring-2 ring-green-500 bg-green-50' : ''}`}>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center justify-between">
                      {calculo.anexo}
                      {calculo.recomendado && (
                        <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          Recomendado
                        </span>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {calculo.erro ? (
                      <Alert variant={calculo.fatorRApplicado ? "default" : "destructive"}>
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

                        <div className={`p-4 rounded-lg border ${calculo.recomendado ? 'bg-green-100 border-green-300' : 'bg-green-50 border-green-200'}`}>
                          <p className="text-sm text-green-700 font-medium">💰 Valor do DAS a Pagar</p>
                          <p className="text-2xl font-bold text-green-800">
                            {formatarValor(calculo.impostoDevido)}
                          </p>
                        </div>

                        {/* Fator R Info */}
                        {calculo.fatorRApplicado && (
                          <Alert>
                            <TrendingUp className="h-4 w-4" />
                            <AlertDescription>
                              <strong>Fator R:</strong> {formatarPercentual(calculo.fatorRValor)}
                              {calculo.observacao && (
                                <span className="block text-orange-600 mt-1">
                                  ⚠️ {calculo.observacao}
                                </span>
                              )}
                            </AlertDescription>
                          </Alert>
                        )}

                        {/* Observações especiais */}
                        {calculo.anexo.includes('Anexo IV') && (
                          <Alert>
                            <Info className="h-4 w-4" />
                            <AlertDescription>
                              INSS Patronal não incluído (pago separadamente)
                            </AlertDescription>
                          </Alert>
                        )}
                        
                        {calculo.anexo.includes('Anexo V') && !calculo.fatorRApplicado && (
                          <Alert>
                            <Info className="h-4 w-4" />
                            <AlertDescription>
                              Para serviços profissionais sem folha de pagamento. 
                              Com folha de pagamento, considere usar o Fator R.
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

export default App