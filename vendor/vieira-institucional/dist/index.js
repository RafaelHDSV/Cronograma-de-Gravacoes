import {
  CONTROLLER_NAME,
  DATA_SUBJECT_SLA,
  DEFAULT_ROUTES,
  ErrorPage,
  IconArrowLeft,
  IconHome,
  InstitucionalProvider,
  SUPPORT_EMAIL,
  SUPPORT_SLA,
  defineInstitucionalConfig,
  deletedAccountMessage,
  formatLegalDate,
  hasLegalPages,
  resolveRoutes,
  supportMailto,
  useInstitucional
} from "./chunk-KSNJRWDB.js";

// src/components/AccountDataSection.tsx
import { useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
function todayStamp() {
  const d = /* @__PURE__ */ new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function downloadJson(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
function AccountDataSection({ onExport, onDelete, className }) {
  const { config } = useInstitucional();
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [understood, setUnderstood] = useState(false);
  const [password, setPassword] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  async function handleExport() {
    setExportError(null);
    setExporting(true);
    try {
      const data = await onExport();
      downloadJson(data, `${config.appSlug}-meus-dados-${todayStamp()}.json`);
    } catch (err) {
      setExportError(err instanceof Error ? err.message : "N\xE3o foi poss\xEDvel gerar o arquivo.");
    } finally {
      setExporting(false);
    }
  }
  async function handleDelete(e) {
    e.preventDefault();
    if (!understood || !password) return;
    setDeleteError(null);
    setDeleting(true);
    try {
      await onDelete(password);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "N\xE3o foi poss\xEDvel excluir a conta.");
      setDeleting(false);
    }
  }
  return /* @__PURE__ */ jsxs("section", { className: ["vi-account-data", className].filter(Boolean).join(" "), "aria-labelledby": "vi-account-data-title", children: [
    /* @__PURE__ */ jsx("h2", { id: "vi-account-data-title", className: "vi-account-data__title", children: "Privacidade e dados" }),
    /* @__PURE__ */ jsxs("div", { className: "vi-account-data__block", children: [
      /* @__PURE__ */ jsx("h3", { children: "Baixar meus dados" }),
      /* @__PURE__ */ jsxs("p", { children: [
        "Um arquivo JSON com tudo o que o ",
        config.appName,
        " guarda sobre voc\xEA."
      ] }),
      /* @__PURE__ */ jsx("button", { type: "button", className: "vi-button", onClick: handleExport, disabled: exporting, children: exporting ? "Gerando\u2026" : "Baixar meus dados" }),
      exportError && /* @__PURE__ */ jsx("p", { className: "vi-consent__error", role: "alert", children: exportError })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "vi-account-data__block vi-account-data__block--danger", children: [
      /* @__PURE__ */ jsx("h3", { children: "Excluir minha conta" }),
      /* @__PURE__ */ jsxs("p", { children: [
        "A exclus\xE3o \xE9 ",
        /* @__PURE__ */ jsx("strong", { children: "imediata e irrevers\xEDvel" }),
        ": seus dados do ",
        config.appName,
        " s\xE3o apagados na hora. Se quiser guardar uma c\xF3pia, baixe seus dados antes."
      ] }),
      !confirming ? /* @__PURE__ */ jsx("button", { type: "button", className: "vi-button vi-button--danger", onClick: () => setConfirming(true), children: "Excluir minha conta" }) : /* @__PURE__ */ jsxs("form", { className: "vi-account-data__confirm", onSubmit: handleDelete, children: [
        /* @__PURE__ */ jsxs("label", { className: "vi-consent__label", children: [
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "checkbox",
              className: "vi-consent__checkbox",
              checked: understood,
              onChange: (e) => setUnderstood(e.target.checked)
            }
          ),
          /* @__PURE__ */ jsx("span", { children: "Entendo que a exclus\xE3o n\xE3o pode ser desfeita." })
        ] }),
        /* @__PURE__ */ jsxs("label", { className: "vi-field", children: [
          /* @__PURE__ */ jsx("span", { className: "vi-field__label", children: "Senha atual" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "password",
              className: "vi-field__input",
              autoComplete: "current-password",
              value: password,
              onChange: (e) => setPassword(e.target.value),
              required: true
            }
          )
        ] }),
        deleteError && /* @__PURE__ */ jsx("p", { className: "vi-consent__error", role: "alert", children: deleteError }),
        /* @__PURE__ */ jsxs("div", { className: "vi-account-data__actions", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "submit",
              className: "vi-button vi-button--danger",
              disabled: !understood || !password || deleting,
              children: deleting ? "Excluindo\u2026" : "Excluir definitivamente"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              className: "vi-button",
              onClick: () => {
                setConfirming(false);
                setPassword("");
                setUnderstood(false);
                setDeleteError(null);
              },
              disabled: deleting,
              children: "Cancelar"
            }
          )
        ] })
      ] })
    ] })
  ] });
}

// src/components/HealthConsent.tsx
import { jsx as jsx2, jsxs as jsxs2 } from "react/jsx-runtime";
function HealthConsent({ checked, onChange, error, description, id = "vi-health-consent" }) {
  const { config } = useInstitucional();
  const routes = resolveRoutes(config);
  const required = config.healthConsent === "required";
  return /* @__PURE__ */ jsxs2("div", { className: "vi-consent vi-consent--highlight", children: [
    /* @__PURE__ */ jsxs2("p", { className: "vi-consent__title", children: [
      "Dados de sa\xFAde ",
      required ? "(obrigat\xF3rio)" : "(opcional)"
    ] }),
    /* @__PURE__ */ jsxs2("label", { className: "vi-consent__label", htmlFor: id, children: [
      /* @__PURE__ */ jsx2(
        "input",
        {
          id,
          type: "checkbox",
          className: "vi-consent__checkbox",
          checked,
          onChange: (e) => onChange(e.target.checked),
          "aria-required": required,
          "aria-invalid": Boolean(error),
          "aria-describedby": error ? `${id}-error` : void 0
        }
      ),
      /* @__PURE__ */ jsxs2("span", { children: [
        "Autorizo o ",
        config.appName,
        " a tratar meus dados de sa\xFAde para ",
        description,
        ". Posso revogar quando quiser, como descrito na",
        " ",
        /* @__PURE__ */ jsx2("a", { href: `${routes.privacy}#sensiveis`, target: "_blank", rel: "noopener noreferrer", className: "vi-link", children: "Pol\xEDtica de privacidade" }),
        "."
      ] })
    ] }),
    error && /* @__PURE__ */ jsx2("p", { id: `${id}-error`, className: "vi-consent__error", role: "alert", children: error })
  ] });
}

// src/components/LegalGate.tsx
import { useState as useState2 } from "react";

// src/components/TermsAcceptance.tsx
import { jsx as jsx3, jsxs as jsxs3 } from "react/jsx-runtime";
function TermsAcceptance({ checked, onChange, error, id = "vi-terms-acceptance" }) {
  const { config } = useInstitucional();
  const routes = resolveRoutes(config);
  return /* @__PURE__ */ jsxs3("div", { className: "vi-consent", children: [
    /* @__PURE__ */ jsxs3("label", { className: "vi-consent__label", htmlFor: id, children: [
      /* @__PURE__ */ jsx3(
        "input",
        {
          id,
          type: "checkbox",
          className: "vi-consent__checkbox",
          checked,
          onChange: (e) => onChange(e.target.checked),
          "aria-required": "true",
          "aria-invalid": Boolean(error),
          "aria-describedby": error ? `${id}-error` : void 0
        }
      ),
      /* @__PURE__ */ jsxs3("span", { children: [
        "Li e aceito os",
        " ",
        /* @__PURE__ */ jsx3("a", { href: routes.terms, target: "_blank", rel: "noopener noreferrer", className: "vi-link", children: "Termos de uso" }),
        " ",
        "e a",
        " ",
        /* @__PURE__ */ jsx3("a", { href: routes.privacy, target: "_blank", rel: "noopener noreferrer", className: "vi-link", children: "Pol\xEDtica de privacidade" }),
        "."
      ] })
    ] }),
    error && /* @__PURE__ */ jsx3("p", { id: `${id}-error`, className: "vi-consent__error", role: "alert", children: error })
  ] });
}

// src/components/LegalGate.tsx
import { Fragment, jsx as jsx4, jsxs as jsxs4 } from "react/jsx-runtime";
function needsLegalAcceptance(acceptance, legalVersion, healthConsent) {
  if (acceptance === void 0) return false;
  if (acceptance === null) return true;
  if (acceptance.termsVersion !== legalVersion || acceptance.privacyVersion !== legalVersion) return true;
  if (healthConsent === "required") {
    return !acceptance.healthConsentAt || Boolean(acceptance.healthConsentRevokedAt);
  }
  return false;
}
function LegalGate({ acceptance, onAccept, onSignOut, healthConsentDescription, children }) {
  const { config } = useInstitucional();
  const [terms, setTerms] = useState2(false);
  const [health, setHealth] = useState2(false);
  const [error, setError] = useState2(null);
  const [submitting, setSubmitting] = useState2(false);
  if (acceptance === void 0) {
    return /* @__PURE__ */ jsx4("div", { className: "vi-gate", role: "status", "aria-live": "polite", "aria-busy": "true", children: /* @__PURE__ */ jsx4("p", { className: "vi-gate__text", children: "Carregando\u2026" }) });
  }
  if (!needsLegalAcceptance(acceptance, config.legalVersion, config.healthConsent)) {
    return /* @__PURE__ */ jsx4(Fragment, { children });
  }
  const askHealth = Boolean(config.healthConsent && healthConsentDescription);
  const healthRequired = config.healthConsent === "required";
  const firstTime = acceptance === null;
  async function handleSubmit(e) {
    e.preventDefault();
    if (!terms) {
      setError("Marque o aceite para continuar.");
      return;
    }
    if (healthRequired && !health) {
      setError("O consentimento de dados de sa\xFAde \xE9 necess\xE1rio para usar o app.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await onAccept({ healthConsent: health });
    } catch (err) {
      setError(err instanceof Error ? err.message : "N\xE3o foi poss\xEDvel registrar o aceite.");
    } finally {
      setSubmitting(false);
    }
  }
  return /* @__PURE__ */ jsx4("div", { className: "vi-gate", role: "dialog", "aria-modal": "true", "aria-labelledby": "vi-gate-title", children: /* @__PURE__ */ jsxs4("form", { className: "vi-gate__card", onSubmit: handleSubmit, children: [
    /* @__PURE__ */ jsx4("h1", { id: "vi-gate-title", className: "vi-gate__title", children: firstTime ? "Antes de continuar" : "Atualizamos os termos" }),
    /* @__PURE__ */ jsx4("p", { className: "vi-gate__text", children: firstTime ? `Para usar o ${config.appName}, leia e aceite os termos de uso e a pol\xEDtica de privacidade.` : `Os termos de uso e a pol\xEDtica de privacidade do ${config.appName} mudaram em ${formatLegalDate(config.legalVersion)}. Para continuar, leia e aceite a nova vers\xE3o.` }),
    /* @__PURE__ */ jsx4(TermsAcceptance, { checked: terms, onChange: setTerms }),
    askHealth && healthConsentDescription && /* @__PURE__ */ jsx4(HealthConsent, { checked: health, onChange: setHealth, description: healthConsentDescription }),
    error && /* @__PURE__ */ jsx4("p", { className: "vi-consent__error", role: "alert", children: error }),
    /* @__PURE__ */ jsxs4("div", { className: "vi-gate__actions", children: [
      /* @__PURE__ */ jsx4("button", { type: "submit", className: "vi-button vi-button--primary", disabled: submitting, children: submitting ? "Salvando\u2026" : "Aceitar e continuar" }),
      onSignOut && /* @__PURE__ */ jsx4("button", { type: "button", className: "vi-button", onClick: onSignOut, children: "Sair" })
    ] })
  ] }) });
}

// src/components/SupportLink.tsx
import { jsx as jsx5 } from "react/jsx-runtime";
function SupportLink({ subject, className, children }) {
  const { config } = useInstitucional();
  return /* @__PURE__ */ jsx5("a", { href: supportMailto(config.appName, subject), className: className ?? "vi-link", children: children ?? SUPPORT_EMAIL });
}

// src/components/LegalLinks.tsx
import { jsx as jsx6, jsxs as jsxs5 } from "react/jsx-runtime";
function LegalLinks({ className, showSupport = true }) {
  const { config, Link } = useInstitucional();
  const routes = resolveRoutes(config);
  return /* @__PURE__ */ jsxs5("div", { className: ["vi-legal-links", className].filter(Boolean).join(" "), children: [
    hasLegalPages(config) && /* @__PURE__ */ jsxs5("nav", { "aria-label": "Documentos legais", className: "vi-legal-links__nav", children: [
      /* @__PURE__ */ jsx6(Link, { to: routes.privacy, className: "vi-link", children: "Privacidade" }),
      /* @__PURE__ */ jsx6(Link, { to: routes.terms, className: "vi-link", children: "Termos" })
    ] }),
    showSupport && /* @__PURE__ */ jsxs5("p", { className: "vi-legal-links__support", children: [
      "Suporte: ",
      /* @__PURE__ */ jsx6(SupportLink, {}),
      " \u2014 resposta em ",
      SUPPORT_SLA
    ] })
  ] });
}

// src/legal/privacy.tsx
import { Fragment as Fragment2, jsx as jsx7, jsxs as jsxs6 } from "react/jsx-runtime";
var BASIS_LABEL = {
  contrato: "execu\xE7\xE3o do contrato (LGPD, art. 7\xBA, V) \u2014 sem esses dados o app n\xE3o funciona",
  consentimento: "consentimento espec\xEDfico e destacado (LGPD, art. 11, I)",
  legitimo_interesse: "leg\xEDtimo interesse (LGPD, art. 7\xBA, IX), com op\xE7\xE3o de recusa"
};
var mail = /* @__PURE__ */ jsx7("a", { href: `mailto:${SUPPORT_EMAIL}`, className: "vi-link", children: SUPPORT_EMAIL });
var anpd = /* @__PURE__ */ jsx7("a", { href: "https://www.gov.br/anpd/", className: "vi-link", rel: "noreferrer", target: "_blank", children: "Autoridade Nacional de Prote\xE7\xE3o de Dados (ANPD)" });
function buildPrivacySections(config) {
  const hasHealth = config.sensitive?.includes("saude") ?? false;
  const thirdParty = config.processesThirdPartyData;
  const sections = [
    {
      id: "controlador",
      title: "Quem cuida dos seus dados",
      body: /* @__PURE__ */ jsxs6(Fragment2, { children: [
        /* @__PURE__ */ jsxs6("p", { children: [
          "O ",
          config.appName,
          " \xE9 ",
          config.description,
          ", mantido por ",
          CONTROLLER_NAME,
          ", pessoa f\xEDsica residente no Brasil. Ele \xE9 o controlador dos dados descritos nesta pol\xEDtica."
        ] }),
        /* @__PURE__ */ jsxs6("p", { children: [
          "Como agente de tratamento de pequeno porte (Resolu\xE7\xE3o CD/ANPD n\xBA 2/2022), n\xE3o h\xE1 encarregado (DPO) indicado. O canal do titular \xE9 o e-mail ",
          mail,
          ". Pedidos de suporte e de privacidade usam o mesmo endere\xE7o; a resposta sai em ",
          SUPPORT_SLA,
          " para suporte e em ",
          DATA_SUBJECT_SLA,
          " para direitos do titular."
        ] }),
        thirdParty && /* @__PURE__ */ jsxs6("p", { children: [
          "Para os dados de ",
          thirdParty.subjects,
          ", quem decide o tratamento \xE9 o cliente que os cadastra: ele \xE9 o controlador desses dados e o ",
          config.appName,
          " atua como operador, seguindo as instru\xE7\xF5es do cliente."
        ] })
      ] })
    },
    {
      id: "dados",
      title: "Dados que coletamos",
      body: /* @__PURE__ */ jsxs6(Fragment2, { children: [
        /* @__PURE__ */ jsxs6("p", { children: [
          "S\xF3 pedimos o que o ",
          config.appName,
          " precisa para funcionar. Hoje isso inclui:"
        ] }),
        /* @__PURE__ */ jsxs6("ul", { children: [
          config.dataInventory.map((group) => /* @__PURE__ */ jsxs6("li", { children: [
            /* @__PURE__ */ jsxs6("strong", { children: [
              group.group,
              ":"
            ] }),
            " ",
            group.items.join("; "),
            "."
          ] }, group.group)),
          /* @__PURE__ */ jsxs6("li", { children: [
            /* @__PURE__ */ jsx7("strong", { children: "Uso do app:" }),
            " p\xE1ginas visitadas, tipo de dispositivo e pa\xEDs aproximado, sem ligar isso ao seu nome ou e-mail."
          ] }),
          config.hasAccount && /* @__PURE__ */ jsxs6("li", { children: [
            /* @__PURE__ */ jsx7("strong", { children: "Registros t\xE9cnicos:" }),
            " se um erro quebra a tela, o Sentry pode receber a mensagem do erro, o arquivo e a linha do c\xF3digo. E-mail, senha, tokens e o conte\xFAdo que voc\xEA digitou s\xE3o removidos antes do envio."
          ] })
        ] }),
        /* @__PURE__ */ jsx7("p", { children: "N\xE3o pedimos CPF, RG, endere\xE7o, telefone, cart\xE3o de cr\xE9dito nem dados de redes sociais. N\xE3o h\xE1 cadastro por Google, Apple ou similar." })
      ] })
    },
    {
      id: "finalidade",
      title: "Para que usamos e com qual base legal",
      body: /* @__PURE__ */ jsxs6(Fragment2, { children: [
        /* @__PURE__ */ jsxs6("ul", { children: [
          config.dataInventory.map((group) => /* @__PURE__ */ jsxs6("li", { children: [
            /* @__PURE__ */ jsxs6("strong", { children: [
              group.group,
              ":"
            ] }),
            " ",
            group.purpose,
            ". Base legal: ",
            BASIS_LABEL[group.basis],
            "."
          ] }, group.group)),
          /* @__PURE__ */ jsxs6("li", { children: [
            /* @__PURE__ */ jsx7("strong", { children: "M\xE9tricas de visita:" }),
            " contar acessos e entender quais telas s\xE3o usadas, para melhorar o app. Base legal: ",
            BASIS_LABEL.legitimo_interesse,
            "."
          ] }),
          /* @__PURE__ */ jsxs6("li", { children: [
            /* @__PURE__ */ jsx7("strong", { children: "Erros t\xE9cnicos:" }),
            " achar e corrigir falhas. Base legal: ",
            BASIS_LABEL.legitimo_interesse,
            "."
          ] })
        ] }),
        /* @__PURE__ */ jsxs6("p", { children: [
          "N\xE3o vendemos dados, n\xE3o alugamos listas, n\xE3o exibimos an\xFAncios e n\xE3o usamos o que voc\xEA registra para treinar modelos de intelig\xEAncia artificial de terceiros. Se um dia o uso dos dados ampliar, esta pol\xEDtica muda de vers\xE3o",
          config.hasAccount ? " e o app pede um novo aceite" : "",
          " antes de valer."
        ] })
      ] })
    }
  ];
  if (hasHealth) {
    sections.push({
      id: "sensiveis",
      title: "Dados de sa\xFAde",
      body: /* @__PURE__ */ jsxs6(Fragment2, { children: [
        /* @__PURE__ */ jsxs6("p", { children: [
          "Dados de sa\xFAde s\xE3o dados sens\xEDveis pela LGPD. O ",
          config.appName,
          " s\xF3 os trata com o seu consentimento espec\xEDfico, dado em destaque e separado do aceite dos termos."
        ] }),
        config.healthConsent === "required" ? /* @__PURE__ */ jsxs6("p", { children: [
          "Como o ",
          config.appName,
          " existe para registrar esses dados, o consentimento \xE9 necess\xE1rio para usar o app. Voc\xEA pode revog\xE1-lo a qualquer momento; ao revogar, o app oferece baixar seus dados e excluir a conta."
        ] }) : /* @__PURE__ */ jsx7("p", { children: "O consentimento \xE9 opcional: sem ele, o app funciona sem os recursos que dependem de dados de sa\xFAde. Voc\xEA pode consentir ou revogar nas configura\xE7\xF5es; ao revogar, a coleta para e o app oferece apagar os dados de sa\xFAde j\xE1 guardados." })
      ] })
    });
  }
  if (thirdParty) {
    sections.push({
      id: "terceiros",
      title: `Dados de ${thirdParty.subjects}`,
      body: /* @__PURE__ */ jsxs6(Fragment2, { children: [
        /* @__PURE__ */ jsx7("p", { children: thirdParty.description }),
        /* @__PURE__ */ jsxs6("p", { children: [
          "O cliente responde pela base legal desse tratamento e por informar essas pessoas. Pedidos de titulares que n\xE3o s\xE3o usu\xE1rios do ",
          config.appName,
          " devem ser feitos ao cliente; o ",
          config.appName,
          " apoia o atendimento pelo ",
          mail,
          "."
        ] })
      ] })
    });
  }
  sections.push(
    {
      id: "compartilhamento",
      title: "Com quem compartilhamos",
      body: /* @__PURE__ */ jsxs6(Fragment2, { children: [
        /* @__PURE__ */ jsx7("p", { children: 'N\xE3o h\xE1 "parceiros de marketing". Os dados passam s\xF3 pelos fornecedores que operam a infraestrutura, e s\xF3 para isso:' }),
        /* @__PURE__ */ jsx7("ul", { children: config.processors.map((p) => /* @__PURE__ */ jsxs6("li", { children: [
          /* @__PURE__ */ jsxs6("strong", { children: [
            p.name,
            ":"
          ] }),
          " ",
          p.purpose,
          p.location ? ` (processamento em ${p.location})` : "",
          "."
        ] }, p.name)) }),
        /* @__PURE__ */ jsx7("p", { children: "Podemos revelar dados se a lei brasileira exigir (ordem judicial ou autoridade competente). Fora isso, ningu\xE9m fora dessa lista l\xEA o que voc\xEA registra." })
      ] })
    },
    {
      id: "transferencia",
      title: "Transfer\xEAncia internacional",
      body: /* @__PURE__ */ jsxs6(Fragment2, { children: [
        /* @__PURE__ */ jsxs6("p", { children: [
          "Parte desses fornecedores processa dados fora do Brasil, em pa\xEDses cujo n\xEDvel de prote\xE7\xE3o pode ser diferente do brasileiro. A transfer\xEAncia existe para executar o servi\xE7o",
          config.hasAccount ? " que voc\xEA contratou ao criar a conta" : "",
          " (LGPD, art. 33, IX), sob os termos de prote\xE7\xE3o de dados de cada fornecedor."
        ] }),
        /* @__PURE__ */ jsxs6("p", { children: [
          "N\xE3o h\xE1 decis\xE3o automatizada que produza efeito jur\xEDdico ou que afete voc\xEA de forma significativa (LGPD, art. 20): o ",
          config.appName,
          " n\xE3o faz perfil de cr\xE9dito, n\xE3o ranqueia pessoas e n\xE3o usa as m\xE9tricas de visita para decidir nada sobre a sua conta."
        ] })
      ] })
    },
    {
      id: "navegador",
      title: "Armazenamento no navegador e cookies",
      body: /* @__PURE__ */ jsxs6(Fragment2, { children: [
        /* @__PURE__ */ jsxs6("p", { children: [
          "O ",
          config.appName,
          " guarda pouca coisa no seu aparelho, e s\xF3 o que a tela precisa:"
        ] }),
        /* @__PURE__ */ jsxs6("ul", { children: [
          config.hasAccount && /* @__PURE__ */ jsxs6("li", { children: [
            /* @__PURE__ */ jsx7("strong", { children: "Sess\xE3o:" }),
            " o token de acesso fica no armazenamento local do navegador enquanto voc\xEA estiver conectado. Sair do app apaga o token. Sem esse token n\xE3o d\xE1 para manter voc\xEA logado."
          ] }),
          /* @__PURE__ */ jsxs6("li", { children: [
            /* @__PURE__ */ jsx7("strong", { children: "Prefer\xEAncias da interface:" }),
            " tema claro ou escuro e, quando o app tiver, volume ou filtros \u2014 tudo local, sem ir para o servidor."
          ] }),
          /* @__PURE__ */ jsxs6("li", { children: [
            /* @__PURE__ */ jsx7("strong", { children: "M\xE9tricas de visita:" }),
            " o Vieira Analytics usa um cookie pr\xF3prio, ",
            /* @__PURE__ */ jsx7("code", { children: "_va_sid" }),
            ", que dura 30 minutos e serve s\xF3 para agrupar as p\xE1ginas de uma mesma visita. O endere\xE7o IP \xE9 usado na hora para estimar o pa\xEDs e descartado em seguida; n\xE3o fica gravado."
          ] }),
          /* @__PURE__ */ jsxs6("li", { children: [
            /* @__PURE__ */ jsx7("strong", { children: "Como recusar as visitas:" }),
            ' se o navegador envia o sinal "Do Not Track", nenhuma visita \xE9 contada. Voc\xEA tamb\xE9m pode pedir a recusa pelo ',
            mail,
            "."
          ] })
        ] }),
        /* @__PURE__ */ jsx7("p", { children: "N\xE3o usamos cookies de publicidade, pixels de redes sociais nem rastreamento entre sites." })
      ] })
    }
  );
  if (config.hasAccount) {
    sections.push(
      {
        id: "retencao",
        title: "Por quanto tempo guardamos",
        body: /* @__PURE__ */ jsxs6(Fragment2, { children: [
          /* @__PURE__ */ jsx7("p", { children: "Os dados da conta e o que voc\xEA registra ficam enquanto a conta existir. Quando voc\xEA exclui a conta, os dados deste app s\xE3o apagados na hora. C\xF3pias de seguran\xE7a dos fornecedores expiram no ciclo de cada um, sem acesso pelo app." }),
          /* @__PURE__ */ jsx7("p", { children: "O e-mail de confirma\xE7\xE3o da exclus\xE3o n\xE3o guarda o conte\xFAdo da conta; s\xF3 registra que o pedido foi atendido. Logs de erro no Sentry seguem a reten\xE7\xE3o do plano, sem dado pessoal." })
        ] })
      },
      {
        id: "direitos",
        title: "Seus direitos",
        body: /* @__PURE__ */ jsxs6(Fragment2, { children: [
          /* @__PURE__ */ jsx7("p", { children: "A LGPD (art. 18) garante a voc\xEA, entre outros, confirma\xE7\xE3o de tratamento, acesso, corre\xE7\xE3o, portabilidade, elimina\xE7\xE3o, informa\xE7\xE3o sobre compartilhamento e revoga\xE7\xE3o de consentimento." }),
          /* @__PURE__ */ jsxs6("ul", { children: [
            /* @__PURE__ */ jsxs6("li", { children: [
              /* @__PURE__ */ jsx7("strong", { children: "Acesso e portabilidade:" }),
              ' "Baixar meus dados", nas configura\xE7\xF5es, gera um arquivo JSON com o que o ',
              config.appName,
              " guarda sobre voc\xEA."
            ] }),
            /* @__PURE__ */ jsxs6("li", { children: [
              /* @__PURE__ */ jsx7("strong", { children: "Elimina\xE7\xE3o:" }),
              ' "Excluir minha conta", nas configura\xE7\xF5es, apaga os dados deste app na hora, depois de confirmar a senha. A confirma\xE7\xE3o chega no e-mail cadastrado.'
            ] }),
            /* @__PURE__ */ jsxs6("li", { children: [
              /* @__PURE__ */ jsx7("strong", { children: "Corre\xE7\xE3o:" }),
              " o que o app deixa editar (perfil, registros) voc\xEA mesmo altera na interface. O restante, pelo ",
              mail,
              "."
            ] }),
            /* @__PURE__ */ jsxs6("li", { children: [
              /* @__PURE__ */ jsx7("strong", { children: "Demais pedidos" }),
              " (informa\xE7\xE3o sobre compartilhamento, revoga\xE7\xE3o, revis\xE3o): escreva para ",
              mail,
              ". Respondemos em ",
              DATA_SUBJECT_SLA,
              "."
            ] })
          ] }),
          /* @__PURE__ */ jsxs6("p", { children: [
            "Voc\xEA tamb\xE9m pode reclamar \xE0 ",
            anpd,
            "."
          ] })
        ] })
      }
    );
  } else {
    sections.push({
      id: "direitos",
      title: "Seus direitos",
      body: /* @__PURE__ */ jsx7(Fragment2, { children: /* @__PURE__ */ jsxs6("p", { children: [
        "Mesmo sem conta, a LGPD (art. 18) vale para as m\xE9tricas de visita e para qualquer dado que esta p\xE1gina trate. Escreva para ",
        mail,
        "; respondemos em ",
        DATA_SUBJECT_SLA,
        ". Voc\xEA tamb\xE9m pode reclamar \xE0 ",
        anpd,
        "."
      ] }) })
    });
  }
  sections.push(
    {
      id: "menores",
      title: "Crian\xE7as e adolescentes",
      body: /* @__PURE__ */ jsxs6("p", { children: [
        "O ",
        config.appName,
        " \xE9 destinado a pessoas com 18 anos ou mais. N\xE3o coletamos dados de crian\xE7as de forma intencional. Se soubermos que uma conta foi criada por algu\xE9m com menos de 18 anos, apagamos os dados e encerramos o acesso."
      ] })
    },
    {
      id: "seguranca",
      title: "Seguran\xE7a",
      body: /* @__PURE__ */ jsxs6(Fragment2, { children: [
        /* @__PURE__ */ jsx7("p", { children: "Senhas s\xE3o guardadas com hash pelo provedor de autentica\xE7\xE3o e nunca em texto. Toda comunica\xE7\xE3o usa HTTPS. Cada conta s\xF3 acessa os pr\xF3prios dados: a interface p\xFAblica do banco recusa leitura an\xF4nima, e a API identifica voc\xEA pelo token da sess\xE3o." }),
        /* @__PURE__ */ jsx7("p", { children: "Nenhum sistema \xE9 infal\xEDvel. Se identificarmos um incidente que possa trazer risco relevante a voc\xEA, avisaremos voc\xEA e a ANPD, no prazo da lei." })
      ] })
    },
    ...config.extraPrivacyNotes?.length ? [
      {
        id: "particularidades",
        title: `Particularidades do ${config.appName}`,
        body: /* @__PURE__ */ jsx7(Fragment2, { children: config.extraPrivacyNotes.map((note) => /* @__PURE__ */ jsx7("p", { children: note }, note)) })
      }
    ] : [],
    {
      id: "alteracoes",
      title: "Altera\xE7\xF5es nesta pol\xEDtica",
      body: /* @__PURE__ */ jsxs6("p", { children: [
        "Quando esta pol\xEDtica mudar, a data da vers\xE3o no topo muda junto",
        config.hasAccount ? " e o app pede um novo aceite no pr\xF3ximo acesso" : "",
        ". Mudan\xE7as que ampliem o uso dos seus dados nunca valem sem o seu aceite. A vers\xE3o anterior deixa de vigorar na mesma data."
      ] })
    },
    {
      id: "contato",
      title: "Como falar conosco",
      body: /* @__PURE__ */ jsxs6("p", { children: [
        "D\xFAvidas, pedidos de titular e relatos de incidente: ",
        mail,
        ". N\xE3o h\xE1 formul\xE1rio dentro do app; o e-mail \xE9 o canal \xFAnico, de prop\xF3sito \u2014 um endere\xE7o s\xF3, que voc\xEA encontra tamb\xE9m nos Termos de uso."
      ] })
    }
  );
  return sections;
}

// src/legal/terms.tsx
import { Fragment as Fragment3, jsx as jsx8, jsxs as jsxs7 } from "react/jsx-runtime";
var mail2 = /* @__PURE__ */ jsx8("a", { href: `mailto:${SUPPORT_EMAIL}`, className: "vi-link", children: SUPPORT_EMAIL });
function buildTermsSections(config) {
  const routes = resolveRoutes(config);
  const thirdParty = config.processesThirdPartyData;
  const privacyLink = /* @__PURE__ */ jsx8("a", { href: routes.privacy, className: "vi-link", children: "Pol\xEDtica de privacidade" });
  const sections = [
    {
      id: "objeto",
      title: "Objeto e aceite",
      body: /* @__PURE__ */ jsxs7(Fragment3, { children: [
        /* @__PURE__ */ jsxs7("p", { children: [
          "O ",
          config.appName,
          " \xE9 ",
          config.description,
          ", mantido por ",
          CONTROLLER_NAME,
          ' ("mantenedor"). Estes termos regem o uso do app. ',
          config.hasAccount ? "Ao criar a conta e marcar o aceite" : "Ao usar o app",
          ", voc\xEA concorda com eles e com a ",
          privacyLink,
          ", que faz parte deste contrato."
        ] }),
        /* @__PURE__ */ jsx8("p", { children: "Se n\xE3o concordar, n\xE3o crie a conta e n\xE3o use o servi\xE7o. Continuar depois de uma vers\xE3o nova, quando o app pedir reaceite, vale como concord\xE2ncia com o texto atual." })
      ] })
    },
    {
      id: "definicoes",
      title: "Defini\xE7\xF5es",
      body: /* @__PURE__ */ jsxs7("ul", { children: [
        /* @__PURE__ */ jsxs7("li", { children: [
          /* @__PURE__ */ jsx8("strong", { children: "App:" }),
          " o ",
          config.appName,
          ", incluindo o site, a API e, quando houver, o aplicativo instal\xE1vel."
        ] }),
        config.hasAccount && /* @__PURE__ */ jsxs7("li", { children: [
          /* @__PURE__ */ jsx8("strong", { children: "Conta:" }),
          " o cadastro feito com e-mail e senha, que identifica voc\xEA no app."
        ] }),
        /* @__PURE__ */ jsxs7("li", { children: [
          /* @__PURE__ */ jsx8("strong", { children: "Conte\xFAdo seu:" }),
          " o que voc\xEA registra, importa ou envia \u2014 textos, arquivos, metadados que voc\xEA corrige, listas e prefer\xEAncias."
        ] }),
        /* @__PURE__ */ jsxs7("li", { children: [
          /* @__PURE__ */ jsx8("strong", { children: "Mantenedor:" }),
          " ",
          CONTROLLER_NAME,
          ", respons\xE1vel pelo ",
          config.appName,
          "."
        ] })
      ] })
    },
    {
      id: "idade",
      title: "Idade m\xEDnima",
      body: /* @__PURE__ */ jsxs7("p", { children: [
        "O ",
        config.appName,
        " \xE9 destinado a pessoas com 18 anos ou mais. Ao aceitar, voc\xEA declara ter essa idade. N\xE3o h\xE1 vers\xE3o infantil nem consentimento de respons\xE1vel."
      ] })
    }
  ];
  if (config.hasAccount) {
    sections.push({
      id: "conta",
      title: "Conta e senha",
      body: /* @__PURE__ */ jsxs7(Fragment3, { children: [
        /* @__PURE__ */ jsxs7("p", { children: [
          "Voc\xEA \xE9 respons\xE1vel pelas informa\xE7\xF5es da conta e por manter a senha em sigilo. A confirma\xE7\xE3o do e-mail pode ser exigida antes do primeiro acesso. Se suspeitar de acesso indevido, troque a senha e avise em",
          " ",
          mail2,
          "."
        ] }),
        /* @__PURE__ */ jsx8("p", { children: "A conta \xE9 pessoal. N\xE3o compartilhe a senha e n\xE3o crie conta no nome de outra pessoa. O mantenedor pode encerrar contas usadas de forma compartilhada ou automatizada quando isso puser em risco o servi\xE7o ou dados de terceiros." })
      ] })
    });
  }
  sections.push(
    {
      id: "uso",
      title: "Uso aceit\xE1vel",
      body: /* @__PURE__ */ jsxs7(Fragment3, { children: [
        /* @__PURE__ */ jsxs7("p", { children: [
          "O ",
          config.appName,
          " \xE9 para uso pessoal e l\xEDcito. N\xE3o \xE9 permitido:"
        ] }),
        /* @__PURE__ */ jsxs7("ul", { children: [
          /* @__PURE__ */ jsx8("li", { children: "usar o app para atividade ilegal ou para violar direitos de outras pessoas;" }),
          /* @__PURE__ */ jsx8("li", { children: "tentar acessar dados de outras contas, sondar a API sem autentica\xE7\xE3o ou burlar os mecanismos de seguran\xE7a;" }),
          /* @__PURE__ */ jsx8("li", { children: "sobrecarregar o servi\xE7o com acessos automatizados, raspagem em massa ou abuso de cotas;" }),
          /* @__PURE__ */ jsx8("li", { children: "enviar conte\xFAdo que voc\xEA n\xE3o tem direito de usar, inclusive arquivos de terceiros sem autoriza\xE7\xE3o;" }),
          /* @__PURE__ */ jsxs7("li", { children: [
            "redistribuir, sublicenciar ou apresentar o ",
            config.appName,
            " como se fosse seu produto."
          ] })
        ] }),
        thirdParty && /* @__PURE__ */ jsxs7("p", { children: [
          "Ao cadastrar dados de ",
          thirdParty.subjects,
          ", voc\xEA declara ter base legal para isso e se compromete a informar essas pessoas sobre o tratamento."
        ] })
      ] })
    },
    {
      id: "conteudo",
      title: "Seu conte\xFAdo",
      body: /* @__PURE__ */ jsxs7(Fragment3, { children: [
        /* @__PURE__ */ jsx8("p", { children: "O conte\xFAdo que voc\xEA registra continua seu. Voc\xEA nos autoriza apenas a armazen\xE1-lo, exibi-lo para voc\xEA e process\xE1-lo o suficiente para operar o app (c\xF3pia de seguran\xE7a, busca, exporta\xE7\xE3o, exclus\xE3o). N\xE3o usamos esse conte\xFAdo para publicidade nem o publicamos." }),
        /* @__PURE__ */ jsx8("p", { children: "Voc\xEA declara que tem direito sobre o que envia e que o conte\xFAdo n\xE3o viola lei nem direito de terceiros. Podemos remover conte\xFAdo ou encerrar a conta se houver den\xFAncia veross\xEDmil ou ordem legal." })
      ] })
    }
  );
  if (config.domainNotices?.length) {
    sections.push({
      id: "avisos",
      title: "Avisos importantes",
      body: /* @__PURE__ */ jsx8("ul", { children: config.domainNotices.map((notice) => /* @__PURE__ */ jsx8("li", { children: notice }, notice)) })
    });
  }
  sections.push(
    {
      id: "servico",
      title: "Servi\xE7o gratuito, como est\xE1",
      body: /* @__PURE__ */ jsxs7(Fragment3, { children: [
        /* @__PURE__ */ jsxs7("p", { children: [
          "O ",
          config.appName,
          ' \xE9 oferecido gratuitamente e "como est\xE1", sem SLA. Fazemos o poss\xEDvel para mant\xEA-lo no ar e sem erros, mas n\xE3o h\xE1 garantia de disponibilidade cont\xEDnua, de aus\xEAncia de falhas nem de adequa\xE7\xE3o a um fim espec\xEDfico.'
        ] }),
        /* @__PURE__ */ jsxs7("p", { children: [
          "Fun\xE7\xF5es podem mudar, pausar ou ser descontinuadas. Se o app for encerrado de vez",
          config.hasAccount ? ", avisaremos com anteced\xEAncia razo\xE1vel pelo e-mail cadastrado e voc\xEA poder\xE1 baixar seus dados antes" : "",
          ". O mantenedor n\xE3o responde por danos indiretos, lucros cessantes ou perda de dados decorrente de falha de terceiros (hospedagem, autentica\xE7\xE3o, rede), salvo dolo ou culpa grave."
        ] })
      ] })
    },
    {
      id: "propriedade",
      title: "Propriedade intelectual",
      body: /* @__PURE__ */ jsxs7("p", { children: [
        "A marca, o c\xF3digo, o visual e os textos institucionais do ",
        config.appName,
        " pertencem ao mantenedor. Os cat\xE1logos de obras, capas e metadados que o app consulta (quando houver) pertencem aos respectivos fornecedores; o ",
        config.appName,
        " s\xF3 os exibe para identificar o que voc\xEA registrou. Nada nestes termos transfere licen\xE7a sobre marca ou c\xF3digo al\xE9m do uso normal do servi\xE7o."
      ] })
    }
  );
  if (config.hasAccount) {
    sections.push({
      id: "encerramento",
      title: "Encerramento da conta",
      body: /* @__PURE__ */ jsxs7(Fragment3, { children: [
        /* @__PURE__ */ jsxs7("p", { children: [
          'Voc\xEA pode excluir a conta a qualquer momento em "Excluir minha conta", nas configura\xE7\xF5es, confirmando a senha. Os dados deste app s\xE3o apagados na hora; a ',
          privacyLink,
          " descreve o que acontece com o login se voc\xEA tamb\xE9m usa outros apps do mantenedor."
        ] }),
        /* @__PURE__ */ jsx8("p", { children: "Podemos suspender ou encerrar contas que violem estes termos, avisando pelo e-mail cadastrado sempre que poss\xEDvel. Em caso de abuso grave (invas\xE3o, fraude), a suspens\xE3o pode ser imediata." })
      ] })
    });
  }
  sections.push(
    {
      id: "alteracoes",
      title: "Altera\xE7\xF5es",
      body: /* @__PURE__ */ jsxs7("p", { children: [
        "Quando estes termos mudarem, a data da vers\xE3o no topo muda",
        config.hasAccount ? " e o app pede um novo aceite no pr\xF3ximo acesso. Recusar o reaceite impede o uso at\xE9 que voc\xEA concorde ou exclua a conta" : "",
        ". A vers\xE3o anterior deixa de vigorar na mesma data."
      ] })
    },
    {
      id: "lei",
      title: "Lei e foro",
      body: /* @__PURE__ */ jsx8("p", { children: "Estes termos seguem a lei brasileira, em especial o C\xF3digo de Defesa do Consumidor e a LGPD, no que couber. Fica eleito o foro do domic\xEDlio do usu\xE1rio para resolver qualquer quest\xE3o, com ressalva das hip\xF3teses legais de compet\xEAncia absoluta." })
    },
    {
      id: "contato",
      title: "Contato",
      body: /* @__PURE__ */ jsxs7("p", { children: [
        "D\xFAvidas sobre estes termos: ",
        mail2,
        ". Resposta em ",
        SUPPORT_SLA,
        ". \xC9 o mesmo endere\xE7o da ",
        privacyLink,
        "."
      ] })
    }
  );
  return sections;
}

// src/components/Seo.tsx
import { useEffect } from "react";
function upsertMeta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}
function upsertCanonical(href) {
  let el = document.head.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}
function Seo({ title, description, noindex = false, path }) {
  const { config } = useInstitucional();
  useEffect(() => {
    document.title = title ? `${title} \xB7 ${config.appName}` : config.appName;
    if (description) upsertMeta("name", "description", description);
    upsertMeta("name", "robots", noindex ? "noindex, nofollow" : "index, follow");
    const base = config.publicUrl.replace(/\/$/, "");
    if (base) {
      upsertCanonical(`${base}${path ?? window.location.pathname}`);
    }
  }, [title, description, noindex, path, config.appName, config.publicUrl]);
  return null;
}

// src/components/SiteFooter.tsx
import { jsx as jsx9, jsxs as jsxs8 } from "react/jsx-runtime";
function SiteFooter({ className }) {
  const { config, Link } = useInstitucional();
  const routes = resolveRoutes(config);
  if (!hasLegalPages(config)) return null;
  return /* @__PURE__ */ jsx9("footer", { className: ["vi-footer", className].filter(Boolean).join(" "), children: /* @__PURE__ */ jsxs8("nav", { "aria-label": "Documentos legais", className: "vi-footer__nav", children: [
    /* @__PURE__ */ jsx9(Link, { to: routes.privacy, className: "vi-link", children: "Privacidade" }),
    /* @__PURE__ */ jsx9(Link, { to: routes.terms, className: "vi-link", children: "Termos" })
  ] }) });
}

// src/components/LegalPage.tsx
import { jsx as jsx10, jsxs as jsxs9 } from "react/jsx-runtime";
function LegalPage({ kind, backHref, backLabel = "In\xEDcio", embedded = false }) {
  const { config, Link } = useInstitucional();
  const routes = resolveRoutes(config);
  const title = kind === "privacy" ? "Pol\xEDtica de privacidade" : "Termos de uso";
  const sections = kind === "privacy" ? buildPrivacySections(config) : buildTermsSections(config);
  const date = formatLegalDate(config.legalVersion);
  const Body = embedded ? "div" : "main";
  return /* @__PURE__ */ jsxs9("div", { className: embedded ? "vi-legal vi-legal--embedded" : "vi-page vi-legal", children: [
    /* @__PURE__ */ jsx10(
      Seo,
      {
        title,
        description: kind === "privacy" ? `Como o ${config.appName} trata os seus dados pessoais.` : `Regras de uso do ${config.appName}.`
      }
    ),
    /* @__PURE__ */ jsxs9(Body, { className: "vi-legal__main", children: [
      !embedded && /* @__PURE__ */ jsxs9(Link, { to: backHref ?? routes.home, className: "vi-link vi-legal__back", children: [
        /* @__PURE__ */ jsx10(IconArrowLeft, {}),
        backLabel
      ] }),
      /* @__PURE__ */ jsxs9("header", { className: "vi-legal__header", children: [
        /* @__PURE__ */ jsx10("p", { className: "vi-legal__eyebrow", children: config.appName }),
        /* @__PURE__ */ jsx10("h1", { className: "vi-legal__title", children: title }),
        /* @__PURE__ */ jsxs9("p", { className: "vi-legal__version", children: [
          "Vers\xE3o ",
          config.legalVersion,
          " \u2014 vigente desde ",
          date
        ] })
      ] }),
      /* @__PURE__ */ jsx10("nav", { "aria-label": "Se\xE7\xF5es", className: "vi-legal__toc", children: /* @__PURE__ */ jsx10("ol", { children: sections.map((s, index) => /* @__PURE__ */ jsx10("li", { children: /* @__PURE__ */ jsxs9("a", { href: `#${s.id}`, className: "vi-link", children: [
        index + 1,
        ". ",
        s.title
      ] }) }, s.id)) }) }),
      sections.map((s, index) => /* @__PURE__ */ jsxs9("section", { id: s.id, className: "vi-legal__section", children: [
        /* @__PURE__ */ jsxs9("h2", { children: [
          index + 1,
          ". ",
          s.title
        ] }),
        s.body
      ] }, s.id))
    ] }),
    !embedded && /* @__PURE__ */ jsx10(SiteFooter, {})
  ] });
}

// src/components/NotFoundPage.tsx
import { jsx as jsx11, jsxs as jsxs10 } from "react/jsx-runtime";
function NotFoundPage({ homeHref }) {
  const { config, Link } = useInstitucional();
  const routes = resolveRoutes(config);
  return /* @__PURE__ */ jsxs10("main", { className: "vi-page vi-status-page", children: [
    /* @__PURE__ */ jsx11(Seo, { title: "P\xE1gina n\xE3o encontrada", noindex: true }),
    /* @__PURE__ */ jsx11("p", { className: "vi-status-page__code", "aria-hidden": true, children: "404" }),
    /* @__PURE__ */ jsx11("h1", { className: "vi-status-page__title", children: "P\xE1gina n\xE3o encontrada" }),
    /* @__PURE__ */ jsx11("p", { className: "vi-status-page__text", children: "O endere\xE7o pode ter mudado ou o link est\xE1 quebrado." }),
    /* @__PURE__ */ jsx11("div", { className: "vi-status-page__actions", children: /* @__PURE__ */ jsxs10(Link, { to: homeHref ?? routes.home, className: "vi-button vi-button--primary", children: [
      /* @__PURE__ */ jsx11(IconHome, {}),
      "In\xEDcio"
    ] }) }),
    /* @__PURE__ */ jsxs10("p", { className: "vi-status-page__help", children: [
      "Se voc\xEA chegou aqui por um link do ",
      config.appName,
      ", avise em",
      " ",
      /* @__PURE__ */ jsx11(SupportLink, { subject: "Link quebrado" }),
      "."
    ] })
  ] });
}
export {
  AccountDataSection,
  CONTROLLER_NAME,
  DATA_SUBJECT_SLA,
  DEFAULT_ROUTES,
  ErrorPage,
  HealthConsent,
  InstitucionalProvider,
  LegalGate,
  LegalLinks,
  LegalPage,
  NotFoundPage,
  SUPPORT_EMAIL,
  SUPPORT_SLA,
  Seo,
  SiteFooter,
  SupportLink,
  TermsAcceptance,
  defineInstitucionalConfig,
  deletedAccountMessage,
  formatLegalDate,
  hasLegalPages,
  needsLegalAcceptance,
  resolveRoutes,
  supportMailto,
  useInstitucional
};
