import { useState, useMemo } from "react";
import {
  Sun, Zap, Home, Building2, Check, AlertTriangle, ChevronLeft,
  ArrowRight, MapPin, Info, ExternalLink, RotateCcw, ShieldCheck,
  CircleSlash, BatteryCharging, Factory, Banknote, Printer, Leaf, Droplets, Tractor
} from "lucide-react";

const REGIONS = [
  "Auvergne-Rhône-Alpes", "Bourgogne-Franche-Comté", "Bretagne",
  "Centre-Val de Loire", "Corse", "Grand Est", "Hauts-de-France",
  "Île-de-France", "Normandie", "Nouvelle-Aquitaine", "Occitanie",
  "Pays de la Loire", "Provence-Alpes-Côte d'Azur", "Outre-mer (DROM)"
];

const fmt = (n) => new Intl.NumberFormat("fr-FR").format(Math.round(n));

export default function Eligo() {
  const [phase, setPhase] = useState("intro");
  const [idx, setIdx] = useState(0);
  const [a, setA] = useState({});
  const [hwPct, setHwPct] = useState(0);

  const set = (id, val) => setA((p) => ({ ...p, [id]: val }));

  const flow = useMemo(() => {
    const q = [];
    q.push({
      id: "profil", title: "Vous êtes…",
      sub: "Le cadre des aides diffère selon votre statut.",
      type: "select",
      options: [
        { v: "particulier", label: "Un particulier", hint: "Maison ou appartement", icon: Home },
        { v: "pro", label: "Un professionnel", hint: "Entreprise, SCI, bailleur, collectivité, syndic", icon: Building2 },
      ],
    });
    if (!a.profil) return q;

    q.push({
      id: "projet", title: "Votre projet concerne…",
      sub: "Sélectionnez le ou les équipements visés.",
      type: "select",
      options: [
        { v: "pv", label: "Panneaux photovoltaïques", hint: "Production d'électricité solaire", icon: Sun },
        { v: "borne", label: "Borne de recharge", hint: "Recharge de véhicule électrique", icon: Zap },
        { v: "both", label: "Les deux", hint: "Solaire + recharge", icon: BatteryCharging },
      ],
    });
    if (!a.projet) return q;
    const hasPV = a.projet === "pv" || a.projet === "both";
    const hasBorne = a.projet === "borne" || a.projet === "both";

    q.push({
      id: "region", title: "Votre région", sub: "Pour orienter vers les bonnes ressources et dispositifs locaux.",
      type: "select", grid: true,
      options: REGIONS.map((r) => ({ v: r, label: r })),
    });
    if (!a.region) return q;
    const isDROM = a.region === "Outre-mer (DROM)";

    if (isDROM) return q;

    if (a.profil === "particulier") {
      q.push({
        id: "logement", title: "Votre logement", sub: "Déterminant pour la prime ADVENIR et la TVA.",
        type: "select",
        options: [
          { v: "maison", label: "Maison individuelle", hint: "Pavillon, maison", icon: Home },
          { v: "copro", label: "Appartement en copropriété", hint: "Immeuble collectif", icon: Building2 },
        ],
      });
      if (!a.logement) return q;

      q.push({
        id: "statut", title: "Vous êtes…", sub: "Locataire : pensez au « droit à la prise » en copropriété.",
        type: "select",
        options: [
          { v: "proprio", label: "Propriétaire" },
          { v: "locataire", label: "Locataire / occupant" },
        ],
      });
      if (!a.statut) return q;

      if (hasBorne && a.logement === "copro") {
        q.push({
          id: "borne_copro_type", title: "Type de projet de recharge",
          sub: "Le plafond ADVENIR dépend de la configuration.",
          type: "select",
          options: [
            { v: "individuelle", label: "Borne individuelle", hint: "Votre seule place — plafond 1 000 € HT" },
            { v: "partagee", label: "Solution partagée", hint: "Mutualisée entre résidents — plafond 1 660 € HT" },
            { v: "collective", label: "Infrastructure collective", hint: "Pré-équipement de tout le parking — plafond 12 500 € HT" },
          ],
        });
        if (!a.borne_copro_type) return q;
      }

      if (hasPV) {
        q.push({
          id: "pv_puissance", title: "Puissance envisagée (photovoltaïque)",
          sub: "La puissance crête conditionne TVA et tarif d'achat.",
          type: "select",
          options: [
            { v: "le3", label: "≤ 3 kWc", hint: "Petite installation" },
            { v: "3_9", label: "3 à 9 kWc", hint: "Installation résidentielle courante" },
            { v: "9_36", label: "9 à 36 kWc", hint: "Grande toiture" },
            { v: "36_100", label: "36 à 100 kWc", hint: "Très grande installation" },
            { v: "g100", label: "> 100 kWc", hint: "Hors guichet ouvert" },
          ],
        });
        if (!a.pv_puissance) return q;

        q.push({
          id: "pv_mode", title: "Mode d'exploitation",
          sub: "Comment comptez-vous valoriser l'électricité produite ?",
          type: "select",
          options: [
            { v: "surplus", label: "Autoconsommation + vente du surplus", hint: "Vous consommez, vous revendez l'excédent" },
            { v: "totale_conso", label: "Autoconsommation totale", hint: "Aucune revente" },
            { v: "vente_totale", label: "Vente totale", hint: "Toute la production revendue" },
          ],
        });
        if (!a.pv_mode) return q;

        q.push({
          id: "pv_env", title: "Panneaux « bas carbone » + pilotage (EMS)",
          sub: "Bilan carbone < 530 kgCO₂eq/kWc et système de gestion d'énergie — exigés pour la TVA à 5,5 %.",
          type: "select",
          options: [
            { v: "oui", label: "Oui, conformes" }, { v: "non", label: "Non" }, { v: "nsp", label: "Je ne sais pas" },
          ],
        });
        if (!a.pv_env) return q;

        q.push({
          id: "pv_thermique", title: "Votre projet inclut-il du solaire thermique ou hybride ?",
          sub: "Chauffe-eau solaire (CESI), système solaire combiné (SSC) ou panneaux hybrides PVT — ouvrent droit à des aides distinctes du photovoltaïque pur.",
          type: "select",
          options: [
            { v: "cesi", label: "Chauffe-eau solaire (CESI)", hint: "Eau chaude sanitaire" },
            { v: "ssc", label: "Système solaire combiné (SSC)", hint: "Chauffage + eau chaude" },
            { v: "pvt", label: "Panneaux hybrides (PVT)", hint: "Électricité + chaleur" },
            { v: "non", label: "Non, photovoltaïque classique uniquement" },
          ],
        });
        if (!a.pv_thermique) return q;

        if (a.pv_thermique !== "non") {
          q.push({
            id: "pv_revenus", title: "Niveau de revenus du foyer",
            sub: "MaPrimeRénov' module son montant selon les ressources (barème ANAH : bleu/jaune/violet/rose).",
            type: "select",
            options: [
              { v: "modeste", label: "Modeste ou très modeste", hint: "Barèmes bleu / jaune" },
              { v: "intermediaire", label: "Intermédiaire", hint: "Barème violet" },
              { v: "superieur", label: "Supérieur", hint: "Barème rose" },
            ],
          });
          if (!a.pv_revenus) return q;

          q.push({
            id: "pv_dpe", title: "Quel est le DPE actuel de votre logement ?",
            sub: "Depuis 2026, MaPrimeRénov' solaire thermique impose un logement classé E, F ou G.",
            type: "select",
            options: [
              { v: "efg", label: "E, F ou G" },
              { v: "abcd", label: "A, B, C ou D" },
              { v: "nsp", label: "Je ne sais pas" },
            ],
          });
          if (!a.pv_dpe) return q;
        }

        q.push({
          id: "pv_cout", title: "Coût estimé de l'installation PV", sub: "Montant HT, hors batterie. Optionnel — pour chiffrer l'économie de TVA.",
          type: "number", unit: "€ HT", optional: true,
        });
        if (a.pv_cout === undefined) return q;
      }

      if (hasBorne) {
        q.push({
          id: "borne_cout", title: "Coût estimé de la borne (pose incluse)", sub: "Montant HT. Optionnel — pour chiffrer les aides.",
          type: "number", unit: "€ HT", optional: true,
        });
        if (a.borne_cout === undefined) return q;
      }
    }

    if (a.profil === "pro") {
      q.push({
        id: "org", title: "Votre organisation", sub: "Le type de structure oriente les dispositifs mobilisables.",
        type: "select", grid: true,
        options: [
          { v: "entreprise", label: "Entreprise / société" },
          { v: "sci", label: "SCI" },
          { v: "bailleur", label: "Bailleur social" },
          { v: "collectivite", label: "Collectivité" },
          { v: "syndic", label: "Copropriété (syndic)" },
          { v: "agricole", label: "Exploitation agricole" },
        ],
      });
      if (!a.org) return q;

      if (hasPV) {
        q.push({
          id: "pvpro_site", title: "Type de site (photovoltaïque)", sub: "Le support d'installation.",
          type: "select",
          options: [
            { v: "toiture", label: "Toiture de bâtiment" },
            { v: "hangar", label: "Hangar / bâtiment agricole" },
            { v: "ombriere", label: "Ombrière de parking" },
          ],
        });
        if (!a.pvpro_site) return q;

        q.push({
          id: "pvpro_puissance", title: "Puissance du projet", sub: "Détermine le régime de soutien applicable.",
          type: "select",
          options: [
            { v: "le9", label: "≤ 9 kWc" },
            { v: "9_100", label: "9 à 100 kWc", hint: "Guichet ouvert S21" },
            { v: "100_500", label: "100 à 500 kWc", hint: "Appel d'offres simplifié" },
            { v: "g500", label: "> 500 kWc", hint: "Appel d'offres CRE" },
          ],
        });
        if (!a.pvpro_puissance) return q;

        q.push({
          id: "pvpro_mode", title: "Mode d'exploitation", sub: "",
          type: "select",
          options: [
            { v: "surplus", label: "Autoconsommation + vente du surplus" },
            { v: "vente_totale", label: "Vente totale" },
          ],
        });
        if (!a.pvpro_mode) return q;

        q.push({
          id: "pvpro_cout", title: "Coût estimé de l'installation PV", sub: "Montant HT. Optionnel.",
          type: "number", unit: "€ HT", optional: true,
        });
        if (a.pvpro_cout === undefined) return q;
      }

      if (hasBorne) {
        q.push({
          id: "bornepro_usage", title: "Usage de la recharge", sub: "Déterminant pour l'éligibilité ADVENIR professionnelle.",
          type: "select", grid: true,
          options: [
            { v: "flotte_vl", label: "Flotte de véhicules légers" },
            { v: "flotte_pl", label: "Flotte poids lourds / autocars", hint: "Catégories N2, N3" },
            { v: "parking_salaries", label: "Parking salariés / visiteurs" },
            { v: "station_publique", label: "Station ouverte au public" },
            { v: "copro_geree", label: "Copropriété gérée" },
          ],
        });
        if (!a.bornepro_usage) return q;

        q.push({
          id: "bornepro_raccordement", title: "Puissance de raccordement du site", sub: "Au-delà de 500 kVA, ADVENIR finance aussi les équipements lourds.",
          type: "select",
          options: [
            { v: "le500", label: "≤ 500 kVA" },
            { v: "g500", label: "> 500 kVA", hint: "Dépôt poids lourds, gros site" },
          ],
        });
        if (!a.bornepro_raccordement) return q;

        q.push({
          id: "bornepro_puissance_points", title: "Puissance des points de recharge", sub: "Conditionne le plafond par point.",
          type: "select",
          options: [
            { v: "ac", label: "12 à 43 kW (AC)", hint: "Recharge normale/accélérée" },
            { v: "dc1", label: "43 à 140 kW (DC)", hint: "Recharge rapide" },
            { v: "dc2", label: "> 140 kW (DC)", hint: "Recharge ultra-rapide" },
          ],
        });
        if (!a.bornepro_puissance_points) return q;

        q.push({
          id: "bornepro_cout", title: "Coût estimé du projet de recharge", sub: "Montant HT total. Optionnel.",
          type: "number", unit: "€ HT", optional: true,
        });
        if (a.bornepro_cout === undefined) return q;
      }
    }

    return q;
  }, [a]);

  const isDROM = a.region === "Outre-mer (DROM)";
  const total = flow.length;
  const cur = flow[Math.min(idx, total - 1)];
  const answered = cur && (cur.optional || (a[cur.id] !== undefined && a[cur.id] !== ""));
  const isLast = idx >= total - 1;

  const pct = Math.max(total > 0 ? Math.round(((idx + 1) / (total + 1)) * 100) : 0, hwPct);

  const next = () => {
    const after = total > 0 ? Math.round(((idx + 1) / total) * 100) : 100;
    setHwPct((p) => Math.max(p, after));
    if (isLast) setPhase("results"); else setIdx((i) => i + 1);
  };
  const back = () => { if (idx === 0) setPhase("intro"); else setIdx((i) => i - 1); };
  const restart = () => { setA({}); setIdx(0); setPhase("intro"); setHwPct(0); };

  const aids = useMemo(() => computeAids(a), [a]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f2f6f1", color: "#1c2620", fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif" }}>
      <div className="max-w-2xl mx-auto px-5 sm:px-8 py-8">
        <header className="flex items-center justify-between mb-10">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-semibold tracking-tight" style={{ color: "#14442f" }}>éligo</span>
            <span className="w-1.5 h-1.5 rounded-full mb-0.5" style={{ backgroundColor: "#3f9d6e" }} />
          </div>
          {phase !== "intro" && (
            <button onClick={restart} className="flex items-center gap-1.5 text-xs text-emerald-700/60 hover:text-emerald-900 transition">
              <RotateCcw size={13} /> Recommencer
            </button>
          )}
        </header>

        {phase === "intro" && (
          <div className="pt-6">
            <p className="text-xs uppercase tracking-widest mb-4" style={{ color: "#3f9d6e" }}>Simulateur d'aides · 2026</p>
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight leading-tight mb-5">
              Quelles aides de l'État pour votre projet <span style={{ color: "#14442f" }}>solaire</span> ou de <span style={{ color: "#14442f" }}>recharge</span> ?
            </h1>
            <p className="leading-relaxed mb-8 max-w-lg" style={{ color: "#4a5a50" }}>
              Quelques questions précises, et vous découvrez uniquement les dispositifs auxquels vous êtes éligible — montants, conditions et sources officielles. Particuliers et professionnels.
            </p>
            <button onClick={() => setPhase("quiz")}
              className="group inline-flex items-center gap-2 text-white px-6 py-3.5 rounded-xl font-medium transition hover:opacity-90"
              style={{ backgroundColor: "#14442f" }}>
              Commencer la simulation
              <ArrowRight size={18} className="group-hover:translate-x-0.5 transition" />
            </button>
            <p className="text-xs mt-6" style={{ color: "#8a978f" }}>Données réglementaires à jour du 11 juin 2026 · Estimation indicative</p>
          </div>
        )}

        {phase === "quiz" && cur && (
          <div>
            <div className="mb-8">
              <div className="flex justify-between text-xs mb-2" style={{ color: "#8a978f" }}>
                <span>Question {idx + 1} / {total}</span>
                <span>{pct}%</span>
              </div>
              <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: "#dbe5dd" }}>
                <div className="h-full rounded-full transition-all duration-300" style={{ width: `${pct}%`, backgroundColor: "#2e7d52" }} />
              </div>
            </div>

            <h2 className="text-2xl font-semibold tracking-tight mb-1.5">{cur.title}</h2>
            {cur.sub && <p className="text-sm mb-6 leading-relaxed" style={{ color: "#4a5a50" }}>{cur.sub}</p>}

            {cur.type === "select" && (
              <div className={cur.grid ? "grid grid-cols-2 gap-2.5" : "space-y-2.5"}>
                {cur.options.map((o) => {
                  const sel = a[cur.id] === o.v;
                  const Icon = o.icon;
                  return (
                    <button key={o.v} onClick={() => set(cur.id, o.v)}
                      className="text-left w-full rounded-xl border px-4 py-3.5 transition flex items-start gap-3"
                      style={sel
                        ? { borderColor: "#2e7d52", backgroundColor: "#e6f1ea", boxShadow: "0 0 0 1px #2e7d52" }
                        : { borderColor: "#d6e0d8", backgroundColor: "#ffffff" }}>
                      {Icon && <Icon size={20} style={{ color: sel ? "#2e7d52" : "#9aa89f", marginTop: 2 }} />}
                      <span className="flex-1">
                        <span className="block font-medium text-[15px]">{o.label}</span>
                        {o.hint && <span className="block text-xs mt-0.5" style={{ color: "#8a978f" }}>{o.hint}</span>}
                      </span>
                      {sel && <Check size={18} style={{ color: "#2e7d52", marginTop: 2 }} />}
                    </button>
                  );
                })}
              </div>
            )}

            {cur.type === "number" && (
              <div>
                <div className="flex items-center rounded-xl border bg-white px-4 py-3" style={{ borderColor: "#d6e0d8" }}>
                  <input type="number" inputMode="numeric" autoFocus placeholder="0"
                    value={a[cur.id] === undefined || a[cur.id] === "" ? "" : a[cur.id]}
                    onChange={(e) => set(cur.id, e.target.value === "" ? "" : Number(e.target.value))}
                    className="flex-1 outline-none text-lg bg-transparent" />
                  <span className="text-sm font-medium" style={{ color: "#8a978f" }}>{cur.unit}</span>
                </div>
                {cur.optional && (
                  <button onClick={() => { set(cur.id, ""); next(); }} className="text-xs mt-3 underline underline-offset-2" style={{ color: "#8a978f" }}>
                    Passer cette question
                  </button>
                )}
              </div>
            )}

            <div className="flex items-center justify-between mt-9">
              <button onClick={back} className="flex items-center gap-1.5 text-sm transition" style={{ color: "#4a5a50" }}>
                <ChevronLeft size={16} /> Précédent
              </button>
              {isDROM && idx === total - 1 ? (
                <button onClick={() => setPhase("results")}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition text-white"
                  style={{ backgroundColor: "#14442f" }}>
                  Voir les informations <ArrowRight size={16} />
                </button>
              ) : (
                <button onClick={next} disabled={!answered}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition"
                  style={answered ? { backgroundColor: "#14442f", color: "#fff" } : { backgroundColor: "#dbe5dd", color: "#9aa89f", cursor: "not-allowed" }}>
                  {isLast ? "Voir mes aides" : "Suivant"} <ArrowRight size={16} />
                </button>
              )}
            </div>
          </div>
        )}

        {phase === "results" && (isDROM
          ? <DromResults a={a} onRestart={restart} onEdit={() => { setPhase("quiz"); setIdx(0); }} />
          : <Results aids={aids} a={a} onRestart={restart} onEdit={() => { setPhase("quiz"); setIdx(0); }} />
        )}

        <footer className="mt-16 pt-6 border-t text-[11px] leading-relaxed" style={{ borderColor: "#d6e0d8", color: "#8a978f" }}>
          <p className="mb-1">Outil d'information indicatif — ne constitue pas un engagement. Vérifiez votre éligibilité auprès des organismes officiels avant tout devis.</p>
          <p>Sources : service-public.gouv.fr · photovoltaique.info · advenir.mobi · economie.gouv.fr · CRE · Légifrance (arrêté S21 du 1ᵉʳ juin 2026) · France Rénov'. Mise à jour : 11 juin 2026.</p>
        </footer>
      </div>
    </div>
  );
}

// ============ ELIGIBILITY ENGINE ============
function computeAids(a) {
  const out = [];
  if (!a.profil || !a.projet) return out;
  const hasPV = a.projet === "pv" || a.projet === "both";
  const hasBorne = a.projet === "borne" || a.projet === "both";
  const coutPV = Number(a.pv_cout || a.pvpro_cout || 0);
  const coutBorne = Number(a.borne_cout || a.bornepro_cout || 0);

  if (a.profil === "particulier") {
    if (hasPV) {
      const small = a.pv_puissance === "le3" || a.pv_puissance === "3_9";
      if (small) {
        const envOK = a.pv_env === "oui";
        const envNsp = a.pv_env === "nsp";
        const val = envOK && coutPV ? coutPV * 0.145 : 0;
        out.push({
          cat: "pv", icon: Sun, title: "TVA réduite à 5,5 % — Photovoltaïque",
          status: envOK ? "eligible" : envNsp ? "conditionnel" : "non", value: val,
          amount: val ? `≈ ${fmt(val)} € économisés` : "TVA 5,5 % au lieu de 20 %",
          desc: "Depuis le 1ᵉʳ octobre 2025, la TVA est ramenée à 5,5 % pour les installations ≤ 9 kWc sur un logement d'habitation.",
          conds: [
            "Puissance ≤ 9 kWc ✓",
            "Panneaux bas carbone (< 530 kgCO₂eq/kWc) + pilotage (EMS) " + (envOK ? "✓" : envNsp ? "à confirmer" : "non rempli → TVA 20 %"),
            "Batteries de stockage exclues du taux réduit (restent à 20 %)",
          ],
          src: { label: "service-public.gouv.fr", url: "https://www.service-public.gouv.fr/particuliers/actualites/A18469" },
        });
      } else {
        out.push({
          cat: "pv", icon: Sun, title: "TVA — Photovoltaïque", status: "non", value: 0,
          amount: "TVA à 20 %",
          desc: "Au-delà de 9 kWc, le taux réduit de 5,5 % ne s'applique pas : la TVA reste à 20 %.",
          conds: ["Taux réduit réservé aux installations ≤ 9 kWc"],
          src: { label: "photovoltaique.info", url: "https://www.photovoltaique.info/fr/preparer-un-projet/qui-suis-je/proprietaire-particulier/taux-de-tva-taxe-sur-la-valeur-ajoutee/" },
        });
      }

      if (a.pv_mode === "surplus") {
        const within = a.pv_puissance !== "g100";
        out.push({
          cat: "pv", icon: Zap, title: "Vente du surplus — Obligation d'achat (EDF OA)",
          status: within ? "eligible" : "non", value: 0,
          amount: "1,1 c€/kWh HT · contrat 20 ans",
          desc: "Depuis l'arrêté S21 du 1ᵉʳ juin 2026, le surplus injecté est racheté à un tarif unique de 1,1 c€/kWh HT, indexé +2 %/an, pour les installations ≤ 100 kWc.",
          conds: [
            within ? "Puissance ≤ 100 kWc ✓" : "Au-delà de 100 kWc : appel d'offres requis",
            "Tarif faible : la rentabilité repose désormais sur l'autoconsommation",
            "Contrat EDF OA sur 20 ans, mécanisme inchangé",
          ],
          src: { label: "CRE / arrêté S21", url: "https://www.cre.fr" },
        });
      }
      if (a.pv_mode === "vente_totale" && (a.pv_puissance === "le3" || a.pv_puissance === "3_9")) {
        out.push({
          cat: "pv", icon: CircleSlash, title: "Vente totale — Non disponible", status: "non", value: 0,
          amount: "Interdite ≤ 9 kWc",
          desc: "L'arrêté S21 de juin 2026 interdit la vente totale pour les installations ≤ 9 kWc. Seule l'autoconsommation avec vente du surplus reste possible.",
          conds: ["Réorientez le projet vers l'autoconsommation + surplus"],
          src: { label: "arrêté S21 (Légifrance)", url: "https://www.legifrance.gouv.fr" },
        });
      }

      out.push({
        cat: "pv", icon: CircleSlash, title: "Prime à l'autoconsommation — Supprimée", status: "supprime", value: 0,
        amount: "0 € depuis le 5 juin 2026",
        desc: "Cette prime (≈ 80 €/kWc fin 2025) a été supprimée par l'arrêté du 1ᵉʳ juin 2026 pour toute demande de raccordement déposée à partir du 4 juin 2026.",
        conds: ["Seuls les dossiers déposés avant le 4 juin 2026 conservent leurs droits"],
        src: { label: "Hellio", url: "https://www.hellio.com/actualites/reglementation/arrete-tarifaire-photovoltaique" },
      });

      if (a.pv_thermique && a.pv_thermique !== "non") {
        const dpeOK = a.pv_dpe === "efg";
        const dpeNsp = a.pv_dpe === "nsp";
        const caps = { cesi: 4000, ssc: 10000, pvt: 2500 };
        const labels = { cesi: "Chauffe-eau solaire individuel (CESI)", ssc: "Système solaire combiné (SSC)", pvt: "Panneaux hybrides (PVT)" };
        const revFactor = { modeste: 1, intermediaire: 0.6, superieur: 0.3 };
        const cap = caps[a.pv_thermique];
        const montant = dpeOK ? Math.round(cap * (revFactor[a.pv_revenus] || 0.3)) : 0;

        out.push({
          cat: "pv", icon: Droplets, title: `MaPrimeRénov' — ${labels[a.pv_thermique]}`,
          status: dpeOK ? "eligible" : dpeNsp ? "conditionnel" : "non", value: montant,
          amount: dpeOK ? `Jusqu'à ${fmt(montant)} € selon revenus` : `Plafond ${fmt(cap)} € (sous conditions)`,
          desc: "MaPrimeRénov' finance la partie thermique des équipements solaires. Montant modulé selon les ressources du foyer (barèmes ANAH).",
          conds: [
            "Logement classé E, F ou G au DPE " + (dpeOK ? "✓" : dpeNsp ? "à confirmer" : "non rempli depuis 2026 → non éligible"),
            "Installateur RGE obligatoire",
            "Cumulable avec la Prime CEE (Prime Effy), la TVA à 5,5 % et l'éco-PTZ",
          ],
          src: { label: "Hellio / MaPrimeRénov'", url: "https://particulier.hellio.com/guide-solaire/types/panneau-solaire-thermique/ma-prime-renov" },
        });

        out.push({
          cat: "pv", icon: Leaf, title: "Prime CEE (Prime Énergie / Effy) — Solaire thermique",
          status: "eligible", value: 0,
          amount: "Montant variable selon revenus",
          desc: "En complément de MaPrimeRénov', la prime CEE est versée par les fournisseurs d'énergie en contrepartie des travaux de rénovation thermique solaire.",
          conds: ["Cumulable avec MaPrimeRénov' et la TVA à 5,5 %", "Montant dépendant de l'opérateur CEE choisi"],
          src: { label: "Quelle Énergie", url: "https://www.quelleenergie.fr/aides-primes/ma-prime-renov/travaux-eligibles/panneau-solaire" },
        });
      } else if (hasPV) {
        out.push({
          cat: "pv", icon: Info, title: "MaPrimeRénov', Éco-PTZ, CEE — Photovoltaïque", status: "non", value: 0,
          amount: "Non concerné (PV pur)",
          desc: "Le photovoltaïque pur (production d'électricité uniquement) n'est éligible ni à MaPrimeRénov', ni aux CEE. Seul le solaire thermique ou hybride (PVT) peut y prétendre.",
          conds: ["Concerne uniquement le solaire thermique / hybride"],
          src: { label: "Dualsun", url: "https://dualsun.com/guides/renovation-energetique/ma-prime-renov/" },
        });
      }
    }

    if (hasBorne) {
      const valTva = coutBorne ? coutBorne * 0.145 : 0;
      out.push({
        cat: "borne", icon: Zap, title: "TVA réduite à 5,5 % — Borne de recharge",
        status: "eligible", value: valTva,
        amount: valTva ? `≈ ${fmt(valTva)} € économisés` : "TVA 5,5 % au lieu de 20 %",
        desc: "La TVA à 5,5 % s'applique à tous les logements, sans condition d'ancienneté (article 278-0 bis N du CGI).",
        conds: [
          "Pose par un professionnel qualifié IRVE obligatoire",
          "Borne pilotable",
          "Aucune attestation d'ancienneté à fournir",
        ],
        src: { label: "ISIOHM / CGI", url: "https://isiohm.fr/aides/" },
      });

      out.push({
        cat: "borne", icon: CircleSlash, title: "Crédit d'impôt borne (CIBRE) — Supprimé", status: "supprime", value: 0,
        amount: "0 € depuis le 1ᵉʳ janvier 2026",
        desc: "Le crédit d'impôt (jusqu'à 500 € par borne) est supprimé pour toute dépense payée à compter du 1ᵉʳ janvier 2026.",
        conds: ["Seules les dépenses payées avant le 31 décembre 2025 restent déclarables"],
        src: { label: "IZI by EDF", url: "https://izi-by-edf.fr/blog/aide-financiere-borne-recharge/" },
      });

      if (a.logement === "maison") {
        out.push({
          cat: "borne", icon: CircleSlash, title: "Prime ADVENIR — Non éligible", status: "non", value: 0,
          amount: "Réservée à la copropriété",
          desc: "Les maisons individuelles (pavillons) sont explicitement exclues du programme ADVENIR. En maison, seule la TVA à 5,5 % subsiste au niveau national.",
          conds: ["ADVENIR réservé au résidentiel collectif"],
          src: { label: "advenir.mobi", url: "https://advenir.mobi" },
        });
      } else if (a.logement === "copro") {
        const t = a.borne_copro_type;
        const cap = t === "individuelle" ? 1000 : t === "partagee" ? 1660 : 12500;
        const label = t === "individuelle" ? "borne individuelle" : t === "partagee" ? "solution partagée" : "infrastructure collective";
        const montant = coutBorne ? Math.min(coutBorne * 0.5, cap) : 0;
        out.push({
          cat: "borne", icon: BatteryCharging, title: "Prime ADVENIR — Copropriété", status: "eligible",
          value: montant,
          amount: montant ? `≈ ${fmt(montant)} € (50 % HT, plafond ${fmt(cap)} €)` : `Jusqu'à ${fmt(cap)} € HT (${label})`,
          desc: "Revalorisée le 1ᵉʳ avril 2026 : 50 % du coût HT, avec des plafonds renforcés selon la configuration.",
          conds: [
            "Projet voté en AG après le 1ᵉʳ avril 2026 pour les nouveaux barèmes",
            "Dossier déposé et accepté AVANT le démarrage des travaux",
            t === "collective" ? "Surprime jusqu'à 8 000 € HT pour les travaux extérieurs (VRD)" : "Cumulable avec la TVA à 5,5 %",
          ],
          src: { label: "advenir.mobi", url: "https://advenir.mobi/2026/03/23/evolution-des-baremes-des-primes-pour-la-recharge-dans-le-residentiel-collectif-afin-de-mieux-repondre-aux-besoins-des-parkings-exterieurs/" },
        });
      }
    }
  }

  if (a.profil === "pro") {
    if (hasPV) {
      const guichet = a.pvpro_puissance === "le9" || a.pvpro_puissance === "9_100";
      out.push({
        cat: "pv", icon: Sun, title: "Régime de soutien photovoltaïque",
        status: guichet ? "eligible" : "conditionnel", value: 0,
        amount: guichet ? "Guichet ouvert S21 · 1,1 c€/kWh surplus" : "Appel d'offres CRE",
        desc: guichet
          ? "Installations ≤ 100 kWc : obligation d'achat au titre de l'arrêté S21. Surplus racheté à 1,1 c€/kWh HT sur 20 ans."
          : "Au-delà de 100 kWc, le projet relève d'un appel d'offres (AOS PPE2 / CRE), avec critères carbone renforcés.",
        conds: [
          "Installateur RGE requis pour l'obligation d'achat",
          guichet ? "Prime à l'investissement supprimée depuis juin 2026" : "Bilan carbone < 740 kg eq CO₂/kWc exigé",
          a.pvpro_site === "ombriere" ? "Ombrières : vérifier la définition de site (distances)" : "Toiture / hangar éligibles",
        ],
        src: { label: "CRE / PPE2", url: "https://www.cre.fr" },
      });
      out.push({
        cat: "fiscal", icon: Banknote, title: "TVA récupérable + amortissement", status: "eligible", value: 0,
        amount: "Avantage fiscal",
        desc: "Pour une structure assujettie, la TVA sur l'installation est récupérable et l'investissement est amortissable comptablement sur plusieurs exercices.",
        conds: ["Société soumise à la TVA et à l'IS/BIC", "À valider avec votre expert-comptable"],
        src: { label: "economie.gouv.fr", url: "https://www.economie.gouv.fr" },
      });
      out.push({
        cat: "pv", icon: CircleSlash, title: "Prime à l'autoconsommation — Supprimée", status: "supprime", value: 0,
        amount: "0 € depuis juin 2026",
        desc: "Supprimée par l'arrêté S21 du 1ᵉʳ juin 2026 pour les nouvelles demandes de raccordement.",
        conds: ["Dossiers antérieurs au 4 juin 2026 préservés"],
        src: { label: "Terre Solaire", url: "https://terresolaire.com/Blog/rentabilite-photovoltaique/tarif-rachat-photovoltaique/" },
      });

      if (a.org === "agricole" || a.pvpro_site === "hangar") {
        out.push({
          cat: "regional", icon: Tractor, title: "Aides agricoles PAC / FEADER — Bâtiments photovoltaïques",
          status: "conditionnel", value: 0,
          amount: "Variable selon région",
          desc: "Les hangars et bâtiments agricoles équipés de photovoltaïque peuvent ouvrir droit à des soutiens régionaux FEADER ou des dispositifs portés par les chambres d'agriculture, en complément du régime national.",
          conds: ["Conditions et enveloppes propres à chaque région", "Se renseigner auprès de la chambre d'agriculture régionale"],
          src: { label: "Chambres d'agriculture", url: "https://chambres-agriculture.fr" },
        });
      }
    }

    if (hasBorne) {
      const pl = a.bornepro_usage === "flotte_pl" || a.bornepro_usage === "station_publique";
      const copro = a.bornepro_usage === "copro_geree";
      const cap = a.bornepro_puissance_points === "ac" ? 2200 : a.bornepro_puissance_points === "dc1" ? 7500 : 15000;
      const big = a.bornepro_raccordement === "g500";

      if (pl) {
        const montant = coutBorne ? Math.min(coutBorne * 0.5, big ? 960000 : cap) : 0;
        out.push({
          cat: "borne", icon: Factory, title: "Prime ADVENIR — Flottes lourdes / stations publiques",
          status: "eligible", value: montant,
          amount: montant ? `≈ ${fmt(montant)} € (50 % HT)` : (big ? "Jusqu'à 960 000 € HT (équipements)" : `Jusqu'à ${fmt(cap)} € HT / point`),
          desc: "ADVENIR finance 50 % du coût HT pour les infrastructures poids lourds (N2/N3), autocars et stations ouvertes au public.",
          conds: [
            `Plafond ${fmt(cap)} € HT par point selon la puissance`,
            big ? "Site > 500 kVA : prise en charge des transformateurs/raccordement (100 k€ à 960 k€)" : "50 % du coût HT, demande sur advenir.mobi",
            "Hors aires de service du réseau autoroutier/national",
          ],
          src: { label: "advenir.mobi", url: "https://advenir.mobi" },
        });
      } else if (copro) {
        const montant = coutBorne ? Math.min(coutBorne * 0.5, 12500) : 0;
        out.push({
          cat: "borne", icon: BatteryCharging, title: "Prime ADVENIR — Résidentiel collectif",
          status: "eligible", value: montant,
          amount: montant ? `≈ ${fmt(montant)} € (50 % HT)` : "Jusqu'à 12 500 € HT / copropriété",
          desc: "Barèmes revalorisés au 1ᵉʳ avril 2026 : 50 % du coût HT, plafonds renforcés en infrastructure collective.",
          conds: ["Vote en AG après le 1ᵉʳ avril 2026", "Dossier avant travaux", "Surprime VRD jusqu'à 8 000 € HT"],
          src: { label: "advenir.mobi", url: "https://advenir.mobi" },
        });
      } else {
        out.push({
          cat: "borne", icon: AlertTriangle, title: "Prime ADVENIR — Ciblage restreint", status: "conditionnel", value: 0,
          amount: "Selon le projet",
          desc: "Depuis 2026, ADVENIR pour les véhicules légers en parking d'entreprise est fortement recentré (priorité aux poids lourds et stations publiques). À vérifier au cas par cas.",
          conds: ["Éligibilité limitée pour les VL en parking privé tertiaire", "Contactez un opérateur ADVENIR pour qualifier le projet"],
          src: { label: "Zeplug", url: "https://www.zeplug.com/news/aide-borne-de-recharge-2026" },
        });
      }

      out.push({
        cat: "borne", icon: Zap, title: "TVA récupérable + amortissement borne", status: "eligible", value: 0,
        amount: "Avantage fiscal",
        desc: "TVA récupérable pour les structures assujetties, amortissement de l'installation, et abattement de 70 % sur l'avantage en nature en cas de mise à disposition d'un VE aux salariés.",
        conds: ["Structure assujettie à la TVA", "Abattement avantage en nature : 70 %"],
        src: { label: "Zeplug", url: "https://www.zeplug.com/news/credit-impot-borne-recharge-entreprise" },
      });

      out.push({
        cat: "borne", icon: CircleSlash, title: "Crédit d'impôt borne — Supprimé", status: "supprime", value: 0,
        amount: "0 € en 2026",
        desc: "Le crédit d'impôt pour l'installation de bornes n'est plus accessible aux entreprises depuis le 1ᵉʳ janvier 2026.",
        conds: ["Privilégiez ADVENIR + amortissement"],
        src: { label: "Zeplug", url: "https://www.zeplug.com/news/credit-impot-borne-recharge-entreprise" },
      });
    }
  }

  out.push({
    cat: "regional", icon: MapPin, title: "Aides locales (région, département, commune)",
    status: "conditionnel", value: 0,
    amount: "À vérifier sur les outils officiels",
    desc: a.profil === "particulier"
      ? "Pour les particuliers, les aides locales sont le plus souvent communales ou intercommunales (subventions ponctuelles, enveloppes limitées). Il n'existe pas de base de données nationale unique et toujours à jour : les outils ci-dessous sont les plus fiables."
      : "Pour les professionnels et collectivités, les régions publient régulièrement des appels à projets (autoconsommation collective, EnR) avec des calendriers et conditions spécifiques.",
    conds: [
      "France Rénov' : simulateur officiel d'aides à la rénovation énergétique, mis à jour en continu",
      "photovoltaique.info : liste les appels à projets régionaux par région",
      "Mairie / intercommunalité : contact direct recommandé pour les subventions communales",
    ],
    src: { label: "France Rénov' — mesaidesreno.beta.gouv.fr", url: "https://mesaidesreno.beta.gouv.fr" },
  });

  return out;
}

// ============ RESULTS ============
function Results({ aids, a, onRestart, onEdit }) {
  const order = { eligible: 0, conditionnel: 1, non: 2, supprime: 3 };
  const sorted = [...aids].sort((x, y) => order[x.status] - order[y.status]);
  const nbMobilisables = aids.filter((x) => x.status === "eligible" || x.status === "conditionnel").length;
  const totalEuro = aids.reduce((s, x) => s + (x.value || 0), 0);

  const hasBorne = a.projet === "borne" || a.projet === "both";
  const hasPV = a.projet === "pv" || a.projet === "both";

  return (
    <div>
      <p className="text-xs uppercase tracking-widest mb-3" style={{ color: "#3f9d6e" }}>Votre résultat</p>
      <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-2 leading-tight">
        {nbMobilisables > 0
          ? `${nbMobilisables} dispositif${nbMobilisables > 1 ? "s" : ""} potentiellement mobilisable${nbMobilisables > 1 ? "s" : ""}`
          : "Voici l'état des aides pour votre projet"}
      </h2>
      <p className="text-sm mb-5" style={{ color: "#4a5a50" }}>
        {a.profil === "particulier" ? "Particulier" : "Professionnel"} · {a.region}
        {a.logement ? " · " + (a.logement === "maison" ? "Maison individuelle" : "Copropriété") : ""}
      </p>

      <div className="rounded-xl p-4 mb-5 flex items-start gap-3" style={{ backgroundColor: "#fff", border: "1px solid #d6e0d8" }}>
        <ShieldCheck size={18} style={{ color: "#2e7d52", marginTop: 2 }} className="shrink-0" />
        <p className="text-xs leading-relaxed" style={{ color: "#4a5a50" }}>
          <strong>Condition transversale obligatoire :</strong> {hasPV && hasBorne
            ? "toutes les aides photovoltaïques ci-dessous nécessitent un installateur certifié RGE, et toutes les aides borne de recharge nécessitent un installateur certifié IRVE. Sans cette certification, aucune aide n'est accessible — vérifiez-le avant de signer un devis."
            : hasPV
              ? "toutes les aides ci-dessous nécessitent un installateur certifié RGE (Reconnu Garant de l'Environnement). Sans cette certification, aucune aide n'est accessible."
              : "toutes les aides ci-dessous nécessitent un installateur certifié IRVE. Sans cette certification, aucune aide n'est accessible."}
        </p>
      </div>

      <div className="rounded-2xl p-5 sm:p-6 mb-6 text-white" style={{ background: "linear-gradient(135deg, #14442f 0%, #1f6244 100%)" }}>
        <div className="flex items-center gap-2 mb-1">
          <Leaf size={16} style={{ color: "#8fd3ae" }} />
          <span className="text-xs uppercase tracking-widest" style={{ color: "#8fd3ae" }}>Estimation chiffrée</span>
        </div>
        {totalEuro > 0 ? (
          <>
            <p className="text-3xl sm:text-4xl font-semibold tracking-tight">≈ {fmt(totalEuro)} €</p>
            <p className="text-sm mt-1" style={{ color: "#c4e3d2" }}>
              d'aides et d'économies directes estimées, selon les coûts que vous avez indiqués et sous réserve des conditions RGE/IRVE.
            </p>
          </>
        ) : (
          <>
            <p className="text-lg font-medium">Renseignez vos coûts pour chiffrer vos aides</p>
            <p className="text-sm mt-1" style={{ color: "#c4e3d2" }}>
              Reprenez la simulation et indiquez le montant HT de vos travaux pour obtenir une estimation en euros.
            </p>
          </>
        )}
      </div>

      <div className="space-y-3">
        {sorted.map((aid, i) => <AidCard key={i} aid={aid} />)}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mt-9">
        <button onClick={onEdit} className="flex-1 inline-flex items-center justify-center gap-2 border px-5 py-3 rounded-xl font-medium text-sm transition hover:bg-white" style={{ borderColor: "#bcccc0", color: "#1c2620" }}>
          <ChevronLeft size={16} /> Modifier
        </button>
        <button onClick={() => window.print()} className="flex-1 inline-flex items-center justify-center gap-2 border px-5 py-3 rounded-xl font-medium text-sm transition hover:bg-white" style={{ borderColor: "#bcccc0", color: "#1c2620" }}>
          <Printer size={15} /> Imprimer / PDF
        </button>
        <button onClick={onRestart} className="flex-1 inline-flex items-center justify-center gap-2 text-white px-5 py-3 rounded-xl font-medium text-sm transition hover:opacity-90" style={{ backgroundColor: "#14442f" }}>
          <RotateCcw size={15} /> Nouvelle simulation
        </button>
      </div>
    </div>
  );
}

function AidCard({ aid }) {
  const Icon = aid.icon || Info;
  const styles = {
    eligible: { badge: { bg: "#e6f1ea", fg: "#1f6244" }, label: "Éligible", border: "#bfe0cd", icon: "#2e7d52" },
    conditionnel: { badge: { bg: "#eaf3ee", fg: "#3f7d5e" }, label: "Sous conditions", border: "#cfe2d6", icon: "#5a9b78" },
    non: { badge: { bg: "#eef1ee", fg: "#7d8a82" }, label: "Non concerné", border: "#dde4de", icon: "#9aa89f" },
    supprime: { badge: { bg: "#eef1ee", fg: "#7d8a82" }, label: "Supprimé", border: "#dde4de", icon: "#b3bfb6" },
  }[aid.status];
  const muted = aid.status === "non" || aid.status === "supprime";

  return (
    <div className="rounded-2xl border bg-white p-5" style={{ borderColor: styles.border, opacity: muted ? 0.82 : 1 }}>
      <div className="flex items-start gap-3.5">
        <div className="mt-0.5 shrink-0" style={{ color: styles.icon }}><Icon size={22} /></div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-1">
            <h3 className="font-semibold text-[15px] leading-snug" style={aid.status === "supprime" ? { textDecoration: "line-through", textDecorationColor: "#c2ccc5" } : {}}>{aid.title}</h3>
            <span className="shrink-0 text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: styles.badge.bg, color: styles.badge.fg }}>{styles.label}</span>
          </div>
          <p className="text-lg font-semibold mb-2" style={{ color: muted ? "#9aa89f" : "#14442f" }}>{aid.amount}</p>
          <p className="text-sm leading-relaxed mb-3" style={{ color: "#4a5a50" }}>{aid.desc}</p>
          <ul className="space-y-1 mb-3">
            {aid.conds.map((c, i) => (
              <li key={i} className="text-xs flex items-start gap-2" style={{ color: "#6a786f" }}>
                <span className="mt-1.5 w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: "#b3bfb6" }} />
                <span>{c}</span>
              </li>
            ))}
          </ul>
          {aid.src && (
            <a href={aid.src.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs hover:underline underline-offset-2" style={{ color: "#2e7d52" }}>
              {aid.src.label} <ExternalLink size={11} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ============ DROM RESULTS ============
function DromResults({ a, onRestart, onEdit }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-widest mb-3" style={{ color: "#3f9d6e" }}>Votre résultat</p>
      <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-2 leading-tight">
        Un régime spécifique s'applique en Outre-mer
      </h2>
      <p className="text-sm mb-6" style={{ color: "#4a5a50" }}>
        {a.profil === "particulier" ? "Particulier" : "Professionnel"} · Outre-mer (DROM / ZNI)
      </p>

      <div className="rounded-2xl p-5 sm:p-6 mb-6 text-white" style={{ background: "linear-gradient(135deg, #14442f 0%, #1f6244 100%)" }}>
        <div className="flex items-center gap-2 mb-1">
          <Leaf size={16} style={{ color: "#8fd3ae" }} />
          <span className="text-xs uppercase tracking-widest" style={{ color: "#8fd3ae" }}>Zones non interconnectées (ZNI)</span>
        </div>
        <p className="text-base leading-relaxed" style={{ color: "#e8f3ee" }}>
          La Guadeloupe, la Martinique, la Guyane, La Réunion, Mayotte, la Corse et plusieurs collectivités d'outre-mer ne sont pas reliées au réseau électrique continental. Le tarif d'achat, la TVA et les primes y suivent des arrêtés et opérateurs différents (EDF SEI) — les chiffres calculés pour la métropole ne s'appliquent pas ici.
        </p>
      </div>

      <div className="space-y-3">
        <AidCard aid={{
          icon: Sun, title: "Photovoltaïque — Tarif d'achat ZNI", status: "conditionnel",
          amount: "Arrêté spécifique ZNI",
          desc: "Les installations situées en ZNI relèvent d'arrêtés tarifaires propres (distincts de l'arrêté S21 métropolitain), avec une prime à l'investissement versée par EDF SEI à la mise en service + 12 mois.",
          conds: ["Tarifs et primes révisés trimestriellement par la CRE, spécifiques à chaque territoire", "Opérateur de référence : EDF SEI (Systèmes Énergétiques Insulaires)"],
          src: { label: "CRE — Transition énergétique ZNI", url: "https://www.cre.fr/electricite/transition-energetique-dans-les-zni.html" },
        }} />
        <AidCard aid={{
          icon: Banknote, title: "TVA photovoltaïque en Outre-mer", status: "conditionnel",
          amount: "Taux différents de la métropole",
          desc: "Le taux de TVA applicable aux installations photovoltaïques en Outre-mer a évolué début 2026 et ne suit pas le même calendrier que la réforme métropolitaine du 5,5 %.",
          conds: ["Vérifier le taux en vigueur pour votre territoire et votre puissance auprès des services fiscaux locaux"],
          src: { label: "monkitsolaire.fr", url: "https://www.monkitsolaire.fr/blog/aides-panneaux-solaires-guadeloupe" },
        }} />
        <AidCard aid={{
          icon: BatteryCharging, title: "Bornes de recharge en Outre-mer", status: "conditionnel",
          amount: "À vérifier localement",
          desc: "Le programme ADVENIR national peut s'appliquer en Outre-mer pour le résidentiel collectif et les flottes, mais les conditions de raccordement et la disponibilité d'installateurs IRVE certifiés varient fortement selon le territoire.",
          conds: ["Vérifier la présence d'installateurs IRVE certifiés sur votre territoire", "Consulter advenir.mobi pour l'éligibilité précise par DROM"],
          src: { label: "advenir.mobi", url: "https://advenir.mobi" },
        }} />
        <AidCard aid={{
          icon: MapPin, title: "Chèque énergie et aides ANAH locales", status: "conditionnel",
          amount: "Selon ressources du foyer",
          desc: "Le chèque énergie et certaines aides ANAH (rénovation, CESI) s'appliquent en Outre-mer selon les mêmes principes qu'en métropole, avec des opérateurs et relais locaux dédiés.",
          conds: ["Se rapprocher de l'Espace Conseil France Rénov' de votre territoire"],
          src: { label: "France Rénov'", url: "https://france-renov.gouv.fr" },
        }} />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mt-9">
        <button onClick={onEdit} className="flex-1 inline-flex items-center justify-center gap-2 border px-5 py-3 rounded-xl font-medium text-sm transition hover:bg-white" style={{ borderColor: "#bcccc0", color: "#1c2620" }}>
          <ChevronLeft size={16} /> Modifier
        </button>
        <button onClick={onRestart} className="flex-1 inline-flex items-center justify-center gap-2 text-white px-5 py-3 rounded-xl font-medium text-sm transition hover:opacity-90" style={{ backgroundColor: "#14442f" }}>
          <RotateCcw size={15} /> Nouvelle simulation
        </button>
      </div>
    </div>
  );
}

