/* ── EMAILJS ── */
emailjs.init('H0v9sswSbS9Q3TCXo');

// Envoie un email via EmailJS — templateId + params
function sendEmail(templateId, params) {
  return emailjs.send('service_gdaddh6', templateId, params);
}

/* ── CURSOR & DESIGN ── */
var cur=document.getElementById('cur'),curR=document.getElementById('curR'),mx=0,my=0,rx=0,ry=0;
document.addEventListener('mousemove',function(e){mx=e.clientX;my=e.clientY;});
(function loop(){cur.style.left=mx+'px';cur.style.top=my+'px';rx+=(mx-rx)*.12;ry+=(my-ry)*.12;curR.style.left=rx+'px';curR.style.top=ry+'px';requestAnimationFrame(loop);})();
window.addEventListener('scroll',function(){document.getElementById('prog').style.transform='scaleX('+(window.scrollY/(document.body.scrollHeight-window.innerHeight))+')';document.getElementById('nav').classList.toggle('s',window.scrollY>60);},{passive:true});
var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting)e.target.classList.add('on');});},{threshold:.12});
document.querySelectorAll('.rv,.rvl,.rvr').forEach(function(el){io.observe(el);});

function countUp(el,target,dur){var s=performance.now();(function step(now){var p=Math.min((now-s)/dur,1);el.textContent=Math.floor((1-Math.pow(1-p,3))*target);if(p<1)requestAnimationFrame(step);else el.textContent=target;})(s);}
var counted=false;
new IntersectionObserver(function(es){if(es[0].isIntersecting&&!counted){counted=true;countUp(document.getElementById('c1'),3,1000);countUp(document.getElementById('c2'),5,1200);countUp(document.getElementById('c3'),36,1600);}},{threshold:.4}).observe(document.getElementById('stats'));

var spSec=document.getElementById('sp-sec');
var spE=document.querySelectorAll('.sp-entry'),spV=document.querySelectorAll('.sp-vis');
function setSport(i){spE.forEach(function(el,j){el.classList.toggle('on',j===i);});spV.forEach(function(el,j){el.classList.toggle('on',j===i);});}
window.addEventListener('scroll',function(){var sc=Math.max(0,-spSec.getBoundingClientRect().top),sa=spSec.offsetHeight-window.innerHeight;setSport(Math.min(4,Math.floor((sc/sa)*5)));},{passive:true});

/* ── COMMUNES MAP ── */
var mapInst=null,mapMarkers={},activeCI=null;
function initMap(){
  if(mapInst)return;
  mapInst=L.map('neoball-map',{center:[48.91,2.57],zoom:10});
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',{attribution:'&copy; OpenStreetMap',subdomains:'abcd',maxZoom:19}).addTo(mapInst);
  refreshMapData(); 
}

function refreshMapData() {
  var data = window.COMMUNES_DB || [];
  if(mapInst) {
    for(var i in mapMarkers) { mapInst.removeLayer(mapMarkers[i]); }
    mapMarkers = {};
    data.forEach(function(c,i){
      var a=c.statut==='actif';
      var icon=L.divIcon({html:'<div style="width:'+(a?20:14)+'px;height:'+(a?20:14)+'px;border-radius:50%;background:'+(a?'#00A878':'rgba(255,255,255,.3)')+';border:2px solid '+(a?'rgba(0,200,140,.6)':'rgba(255,255,255,.15)')+';box-shadow:0 0 '+(a?'10px rgba(0,168,120,.7)':'4px rgba(255,255,255,.1)')+';cursor:pointer"></div>',className:'',iconSize:[20,20],iconAnchor:[10,10],popupAnchor:[0,-12]});
      var pop='<div class="pop"><p class="pop-name">'+c.nom+'</p><p class="pop-dept">'+c.dept+'</p><span class="pop-tag '+c.statut+'">'+(a?'✓ Partenaire actif':'○ En discussion')+'</span></div>';
      var m=L.marker([c.lat,c.lng],{icon}).addTo(mapInst).bindPopup(pop,{maxWidth:240});
      m.on('click',function(){selectCommune(i);});
      mapMarkers[i]=m;
    });
  }
  renderCMList(data);
  updateCMStats(data);
}

function renderCMList(data){
  var list=document.getElementById('cm-list');if(!list)return;
  list.innerHTML=data.map(function(c){var i=window.COMMUNES_DB.indexOf(c);return '<div class="cm-item'+(i===activeCI?' active':'')+'" id="cmi-'+i+'" onclick="selectCommune('+i+')"><div class="cm-dot '+c.statut+'"></div><div class="cm-item-info"><p class="cm-item-name">'+c.nom+'</p><p class="cm-item-dept">'+c.dept+'</p></div><span class="cm-badge '+c.statut+'">'+(c.statut==='actif'?'Actif':'Prospect')+'</span></div>';}).join('');
}
function selectCommune(i){
  if(activeCI!==null){var o=document.getElementById('cmi-'+activeCI);if(o)o.classList.remove('active');}
  activeCI=i;
  var item=document.getElementById('cmi-'+i);
  if(item){item.classList.add('active');item.scrollIntoView({behavior:'smooth',block:'nearest'});}
  if(mapInst&&mapMarkers[i]){mapInst.flyTo([window.COMMUNES_DB[i].lat,window.COMMUNES_DB[i].lng],13,{duration:.7});mapMarkers[i].openPopup();}
}
function filterCommunes(q){
    renderCMList((window.COMMUNES_DB || []).filter(function(c){
        return c.nom.toLowerCase().includes(q.toLowerCase())||c.dept.toLowerCase().includes(q.toLowerCase());
    }));
}
function updateCMStats(data){
  var t=document.getElementById('cm-n-total'),a=document.getElementById('cm-n-actif'),d=document.getElementById('cm-n-dept');
  if(t)t.textContent=data.length;
  if(a)a.textContent=data.filter(function(c){return c.statut==='actif';}).length;
  if(d)d.textContent=new Set(data.map(function(c){return c.dept;})).size;
}
new IntersectionObserver(function(es){if(es[0].isIntersecting)setTimeout(initMap,200);},{threshold:.1}).observe(document.getElementById('communes'));

/* ════════════════════════════════════════
   SYSTÈME DE RÉSERVATION DYNAMIQUE
════════════════════════════════════════ */
var MOIS=['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
var calY=0,calM=0,selDays=[],resaEduc=3,selProfs=[],curStep=1;
const ALLOWED_DAYS = [1, 2, 3, 4, 5, 6]; 

function initTimeSelects() {
    var opts = '';
    for(var h = 8; h <= 22; h++) {
        for(var m = 0; m < 60; m+=15) {
            if (h === 22 && m > 0) continue; 
            var hh = h < 10 ? '0'+h : h;
            var mm = m === 0 ? '00' : m;
            opts += '<option value="'+hh+':'+mm+'">'+hh+'h'+mm+'</option>';
        }
    }
    var s1 = document.getElementById('time-start');
    var s2 = document.getElementById('time-end');
    if(s1 && s1.options.length === 0) { s1.innerHTML = opts; s1.value = '14:00'; }
    if(s2 && s2.options.length === 0) { s2.innerHTML = opts; s2.value = '16:00'; }
}

function getSlotForDate(ds) {
  const d = new Date(ds + 'T12:00:00');
  const dayOfWeek = d.getDay();
  if (!ALLOWED_DAYS.includes(dayOfWeek)) return null;
  return { id: ds, date: ds, dispo: true };
}

// Vérifie si un créneau horaire chevauche une réservation existante
function isTimeBlocked(ds, startVal, endVal) {
  if (!window.BLOCKED_SLOTS_DB) return false;
  var sMin = toMin(startVal), eMin = toMin(endVal);
  return window.BLOCKED_SLOTS_DB.some(function(slot) {
    if (slot.date !== ds) return false;
    var bsMin = toMin(slot.start), beMin = toMin(slot.end);
    return sMin < beMin && eMin > bsMin;
  });
}

// Vérifie les conflits d'éducateurs : retourne la liste des conflits {educ, commune}
function checkEducConflicts(dates, startVal, endVal, profsSelectionnes) {
  if (!window.BLOCKED_SLOTS_DB || !profsSelectionnes || !profsSelectionnes.length) return [];
  var sMin = toMin(startVal), eMin = toMin(endVal);
  var conflicts = [];
  dates.forEach(function(ds) {
    window.BLOCKED_SLOTS_DB.forEach(function(slot) {
      if (slot.date !== ds) return;
      // Ignorer les slots sans profs (anciennes resas) - on sait que desormais tout slot a des profs
      if (!slot.profs || slot.profs === '') return;
      var bsMin = toMin(slot.start), beMin = toMin(slot.end);
      if (!(sMin < beMin && eMin > bsMin)) return; // pas de chevauchement horaire
      // Conflit uniquement si l'educateur exact est dans ce slot
      profsSelectionnes.forEach(function(prof) {
        var prenomProf = prof.split(' ')[0].toLowerCase();
        if (slot.profs.toLowerCase().includes(prenomProf)) {
          conflicts.push({
            educ: prof,
            commune: slot.commune || '?',
            date: new Date(ds + 'T12:00:00').toLocaleDateString('fr-FR', {weekday:'long', day:'numeric', month:'long'}),
            horaire: slot.start + ' - ' + slot.end
          });
        }
      });
    });
  });
  return conflicts;
}

function toMin(t) {
  var parts = t.replace('h',':').split(':');
  return parseInt(parts[0]) * 60 + parseInt(parts[1] || 0);
}

function openResa(){
  var now=new Date();calY=now.getFullYear();calM=now.getMonth();
  selDays=[];resaEduc=3;selProfs=[];curStep=1;
  initTimeSelects();
  document.getElementById('custom-time-panel').classList.remove('active');
  document.querySelectorAll('.conf-sport').forEach(function(b,i){b.classList.toggle('on',i===0);});
  ['ri-nom','ri-commune','ri-email','ri-tel'].forEach(function(id){var el=document.getElementById(id);if(el)el.value='';});
  document.getElementById('resa-ok').style.display='none';
  document.getElementById('resa-err').style.display='none';
  document.getElementById('rf-next').style.display='';
  goStep(1);
  buildCal();
  document.getElementById('resa-overlay').classList.add('open');
  document.body.style.overflow='hidden';
}

function closeResa(){
  document.getElementById('resa-overlay').classList.remove('open');
  document.body.style.overflow='';
}

function calMove(delta){
  calM+=delta;
  if(calM>11){calM=0;calY++;}
  if(calM<0){calM=11;calY--;}
  buildCal();
}

function buildCal(){
  document.getElementById('cal-label').textContent=MOIS[calM]+' '+calY;
  var grid=document.getElementById('cal-grid');
  grid.innerHTML='';
  var today=new Date(); today.setHours(0,0,0,0);
  var dow=new Date(calY,calM,1).getDay();
  var offset=(dow===0)?6:dow-1;
  var daysInMonth=new Date(calY,calM+1,0).getDate();
  var daysInPrev=new Date(calY,calM,0).getDate();
  var cells=[];
  for(var i=0;i<offset;i++) cells.push({d:daysInPrev-offset+1+i,cur:false});
  for(var i=1;i<=daysInMonth;i++) cells.push({d:i,cur:true});
  while(cells.length%7!==0) cells.push({d:cells.length-offset-daysInMonth+1,cur:false});

  cells.forEach(function(c){
    var el=document.createElement('div');
    el.className='cd';
    if(!c.cur){ el.classList.add('other'); el.textContent=c.d; grid.appendChild(el); return; }

    var ds = calY + '-' + (calM + 1 < 10 ? '0' : '') + (calM + 1) + '-' + (c.d < 10 ? '0' : '') + c.d;
    var cellDate = new Date(calY, calM, c.d);
    el.textContent=c.d;

    if(cellDate < today){
      el.classList.add('past');
    } else {
      var slot = getSlotForDate(ds);
      if(slot){
        el.classList.add('avail');
        var dot=document.createElement('div');dot.className='cd-dot';el.appendChild(dot);
        if(selDays.includes(ds)) el.classList.add('sel');
        el.addEventListener('click', function(){ pickDay(ds); });
      }
      // Indicateur partiel si au moins un slot est déjà pris sur ce jour (nouveau ou ancien format)
      var hasExisting = (window.BLOCKED_SLOTS_DB && window.BLOCKED_SLOTS_DB.some(function(s){ return s.date===ds; }))
                     || (window.BLOCKED_DATES_LEGACY && window.BLOCKED_DATES_LEGACY.includes(ds));
      if (hasExisting) {
        var dot2 = document.createElement('div');
        dot2.className = 'cd-dot-partial';
        el.appendChild(dot2);
      }
    }
    grid.appendChild(el);
  });
}

function pickDay(ds){
  const idx = selDays.indexOf(ds);
  if(idx > -1) { selDays.splice(idx, 1); } 
  else { selDays.push(ds); }
  selDays.sort(); 
  buildCal();
  
  if(selDays.length > 0) {
      var lbl = selDays.length === 1 ? '1 date sélectionnée' : selDays.length + ' dates sélectionnées';
      document.getElementById('custom-time-title').textContent = lbl;
      document.getElementById('custom-time-panel').classList.add('active');

      // --- LOGIQUE DE BLOCAGE DES OPTIONS ---
      const radioUnique = document.getElementById('radio-unique');
      const radioStage = document.getElementById('radio-stage');
      const labelStage = document.getElementById('label-stage');
      const msgVacances = document.getElementById('msg-vacances');
      const radioAnnee = document.getElementById('radio-annee');
      const labelAnnee = document.getElementById('label-annee');
      const msgEcole = document.getElementById('msg-ecole');

      if(typeof window.estPendantVacances === 'function') {
          if (window.estPendantVacances(ds)) {
              // VACANCES : Stage OK / Année BLOQUÉE
              radioStage.disabled = false;
              labelStage.style.opacity = "1";
              msgVacances.style.display = "none";
              
              radioAnnee.disabled = true;
              if(radioAnnee.checked) radioUnique.checked = true; 
              labelAnnee.style.opacity = "0.5";
              msgEcole.style.display = "inline-block";
          } else {
              // ÉCOLE : Année OK / Stage BLOQUÉ
              radioStage.disabled = true;
              if(radioStage.checked) radioUnique.checked = true;
              labelStage.style.opacity = "0.5";
              msgVacances.style.display = "inline-block"; 
              
              radioAnnee.disabled = false;
              labelAnnee.style.opacity = "1";
              msgEcole.style.display = "none";
          }
      }
toggleDateFin();
  } else {
      document.getElementById('custom-time-panel').classList.remove('active');
  }
  validateTimes();
}

function validateTimes() {
    var start = document.getElementById('time-start').value;
    var end = document.getElementById('time-end').value;
    
    if(selDays.length > 0 && start && end && start < end) {
        setNextBtn(true, 'Configurer ma séance');
    } else {
        setNextBtn(false, selDays.length === 0 ? 'Sélectionnez une date' : 'Horaires invalides');
    }
}

function setNextBtn(enabled,txt){
  var btn=document.getElementById('rf-next');
  var label=document.getElementById('rf-next-txt');
  btn.disabled=!enabled;
  label.textContent=txt;
}

function goStep(n){
  // Avant step 2 : vérifier que l'heure ne chevauche pas une resa existante
  if (n === 2) {
    var startV = document.getElementById('time-start').value;
    var endV   = document.getElementById('time-end').value;
    var conflicts = selDays.filter(function(ds){ return isTimeBlocked(ds, startV, endV); });
    if (conflicts.length > 0) {
      var conflictDates = conflicts.map(function(ds){
        return new Date(ds+'T12:00:00').toLocaleDateString('fr-FR',{day:'numeric',month:'long'});
      }).join(', ');
      alert('Ce créneau horaire est déjà réservé pour : ' + conflictDates + '. Merci de choisir un autre horaire.');
      return;
    }
  }
  curStep=n;
  document.querySelectorAll('.rs').forEach(function(el){el.classList.remove('active');});
  document.getElementById('rs'+n).classList.add('active');
  var steps=[document.getElementById('rhs1'),document.getElementById('rhs2'),document.getElementById('rhs3')];
  steps.forEach(function(el,i){
    el.classList.remove('active','done');
    if(i+1===n) el.classList.add('active');
    else if(i+1<n) el.classList.add('done');
  });
  document.getElementById('rf-back').style.visibility=(n===1)?'hidden':'visible';
  if(n===1) validateTimes();
  if(n===2){setNextBtn(true,'Voir le récapitulatif'); fillStep2();}
  if(n===3){setNextBtn(true,'Envoyer ma demande'); fillStep3();}
}

function resaNext(){
  if(curStep===1 && selDays.length > 0) goStep(2);
  else if(curStep===2) {
    // Vérification des conflits d'éducateurs
    var startV2 = document.getElementById('time-start').value;
    var endV2   = document.getElementById('time-end').value;
    selProfs = [].map.call(document.querySelectorAll('.prof-card.on'), function(b){ return b.dataset.prof; });

    if (!selProfs.length) {
      alert('⚠ Merci de sélectionner au moins un éducateur.');
      return;
    }

    // Verif conflits educateurs
    var educConflicts = checkEducConflicts(selDays, startV2, endV2, selProfs);
    if (educConflicts.length > 0) {
      var seen = {};
      var uniq = educConflicts.filter(function(c) {
        var key = c.educ + '_' + c.date;
        if (seen[key]) return false;
        seen[key] = true; return true;
      });
      var msg = 'Conflit educateur detecte :\n\n';
      uniq.forEach(function(c) {
        msg += '- ' + c.educ + ' est deja reserve le ' + c.date + ' de ' + c.horaire + ' (commune: ' + c.commune + ')\n';
      });
      msg += '\nCette demande ne peut pas etre envoyee. Choisissez un autre horaire ou d\'autres educateurs.';
      alert(msg);
      return; // BLOCAGE DUR - pas de goStep(3)
    }
    goStep(3);
  }
  else if(curStep===3) sendResa();
  else if(curStep===3) sendResa();
}
function resaBack(){if(curStep>1) goStep(curStep-1);}

function fillStep2(){
  // Reset + restore prof buttons
  document.querySelectorAll('.prof-card').forEach(function(b){
    var isOn=selProfs.indexOf(b.dataset.prof)>=0;
    b.classList.toggle('on',isOn);
  });
  resaEduc=selProfs.length||1;
  var lbl = selDays.length === 1 ? '1 date' : selDays.length + ' dates';
  var start = document.getElementById('time-start').value.replace(':', 'h');
  var end = document.getElementById('time-end').value.replace(':', 'h');
  document.getElementById('cr-date').textContent=lbl;
  document.getElementById('cr-hours').textContent=start+' – '+end;
  document.getElementById('educ-val').textContent=resaEduc;
  updateRatio();
}
function toggleProf(btn){
  btn.classList.toggle('on');
  selProfs=[].map.call(document.querySelectorAll('.prof-card.on'),function(b){return b.dataset.prof;});
  resaEduc=selProfs.length||1;
  updateRatio();
}
function updateRatio(){
  var parts=parseInt(document.getElementById('parts-input').value)||0;
  var max=resaEduc*12;
  var hint=document.getElementById('ratio-hint');
  if(!hint)return;
  if(!parts||parts<=max){hint.className='conf-hint ok';hint.textContent='Max légal : '+max+' participants';}
  else{hint.className='conf-hint warn';hint.textContent='⚠ '+parts+' participants → '+Math.ceil(parts/12)+' éducs requis';}
}

function calcDuree(){
  var start = document.getElementById('time-start').value;
  var end = document.getElementById('time-end').value;
  var sh = parseInt(start.split(':')[0]), sm = parseInt(start.split(':')[1]);
  var eh = parseInt(end.split(':')[0]), em = parseInt(end.split(':')[1]);
  return ((eh*60+em) - (sh*60+sm)) / 60; 
}

function fillStep3(){
    const type = document.querySelector('input[name="type_resa"]:checked').value;
    const nbSeances = calculerNombreSeances();
    
    const start = document.getElementById('time-start').value.replace(':', 'h');
    const end = document.getElementById('time-end').value.replace(':', 'h');
    
    const dureeSeance = calcDuree(); 
    const dureeFacturee = Math.ceil(dureeSeance);
    
    // CALCUL DU PRIX : (Heures facturées × Nb séances × Nb éducs × 35€)
    const prixTotal = dureeFacturee * nbSeances * resaEduc * 35;

    let texteDates = "";
    if (type === 'unique') texteDates = selDays.length + " séance(s) ponctuelle(s)";
    else if (type === 'stage') texteDates = "Stage de 5 jours (Semaine complète)";
    else texteDates = "Récurrence hebdo (" + nbSeances + " séances)";

    // Profs sélectionnés
    selProfs=[].map.call(document.querySelectorAll('.prof-card.on'),function(b){return b.dataset.prof;});
    resaEduc=selProfs.length||1;
    var profsLabel=selProfs.length?selProfs.join(', '):'Non précisé';
    document.getElementById('rr-educ').textContent=profsLabel;
    document.getElementById('rr-date').textContent = texteDates;
    document.getElementById('rr-hours').textContent = start + ' – ' + end;
    document.getElementById('rr-prix').textContent = prixTotal.toLocaleString('fr-FR') + ' €';
    
    // Mise à jour du petit libellé de détails sous le prix
    const detail = document.getElementById('prix-facture-lbl');
    if(detail) detail.textContent = "(Facturé " + dureeFacturee + "h/séance × " + nbSeances + " séances)";
}

function toggleDateFin() {
    const radioAnnee = document.getElementById('radio-annee');
    const zone = document.getElementById('zone-date-fin');
    if(!radioAnnee || !zone) return;

    zone.style.display = radioAnnee.checked ? 'block' : 'none';
    
    if(radioAnnee.checked && !document.getElementById('date-fin-recurrence').value) {
        let d = new Date();
        d.setMonth(d.getMonth() + 3);
        document.getElementById('date-fin-recurrence').value = d.toISOString().split('T')[0];
    }
}

function calculerNombreSeances() {
    const type = document.querySelector('input[name="type_resa"]:checked').value;
    if (type === 'unique') return selDays.length;
    if (type === 'stage') return 5;
    if (type === 'annee') {
        const debut = new Date(selDays[0]);
        const finInput = document.getElementById('date-fin-recurrence').value;
        if(!finInput) return 1;
        const fin = new Date(finInput);
        if (fin <= debut) return 1;
        const diff = fin - debut;
        return Math.floor(diff / (7 * 24 * 60 * 60 * 1000)) + 1;
    }
    return 1;
}

async function sendResa(){
  var nom=document.getElementById('ri-nom').value.trim();
  var commune=document.getElementById('ri-commune').value.trim();
  var email=document.getElementById('ri-email').value.trim();
  var tel=document.getElementById('ri-tel').value.trim();
  
  if(!nom||!commune||!email){alert('Merci de remplir nom, commune et email.');return;}
  
  var btn=document.getElementById('rf-next');
  btn.disabled=true;
  document.getElementById('rf-next-txt').textContent='Enregistrement...';

  try {
      var datesLbl = selDays.map(function(ds) {
          return new Date(ds+'T12:00:00').toLocaleDateString('fr-FR',{day:'numeric',month:'short',year:'numeric'});
      }).join(', ');
      
      var start = document.getElementById('time-start').value.replace(':', 'h');
      var end = document.getElementById('time-end').value.replace(':', 'h');
      var sports = [].map.call(document.querySelectorAll('.conf-sport.on'),function(b){return b.textContent.trim();}).join(', ')||'Non précisé';
      var dureeFacturee = Math.ceil(calcDuree());
      
      // Générer toutes les dates récurrentes si type "annee" ou "stage"
      var typeResa = document.querySelector('input[name="type_resa"]:checked').value;
      var allDates = selDays.slice(); // copie
      if (typeResa === 'annee' && selDays.length > 0) {
          var finInput = document.getElementById('date-fin-recurrence').value;
          if (finInput) {
              var cursor = new Date(selDays[0] + 'T12:00:00');
              var finDate = new Date(finInput + 'T12:00:00');
              cursor.setDate(cursor.getDate() + 7); // commence à J+7
              while (cursor <= finDate) {
                  var y = cursor.getFullYear();
                  var mo = (cursor.getMonth()+1 < 10 ? '0' : '') + (cursor.getMonth()+1);
                  var da = (cursor.getDate() < 10 ? '0' : '') + cursor.getDate();
                  var ds = y + '-' + mo + '-' + da;
                  // On exclut les dates pendant les vacances scolaires
                  var enVacances = (typeof window.estPendantVacances === 'function') && window.estPendantVacances(ds);
                  if (!enVacances) {
                      allDates.push(ds);
                  }
                  cursor.setDate(cursor.getDate() + 7);
              }
          }
      } else if (typeResa === 'stage' && selDays.length > 0) {
          var base = new Date(selDays[0] + 'T12:00:00');
          for (var di = 1; di < 5; di++) {
              var nd = new Date(base); nd.setDate(nd.getDate() + di);
              var y2 = nd.getFullYear();
              var mo2 = (nd.getMonth()+1 < 10 ? '0' : '') + (nd.getMonth()+1);
              var da2 = (nd.getDate() < 10 ? '0' : '') + nd.getDate();
              allDates.push(y2 + '-' + mo2 + '-' + da2);
          }
      }

      // Construire les slots (date + horaire) pour le blocage précis
      var startRaw = document.getElementById('time-start').value;
      var endRaw = document.getElementById('time-end').value;
      var slotIds = allDates.map(function(d){ return d + '_' + startRaw + '_' + endRaw; });

      var finResaInput = document.getElementById('date-fin-recurrence').value;
      var typeResaLabel = typeResa === 'unique' ? 'Événement' : typeResa === 'stage' ? 'Stage' : 'Séance régulière';
      var dateFinLabel = (typeResa === 'annee' && finResaInput)
        ? new Date(finResaInput + 'T12:00:00').toLocaleDateString('fr-FR', {day:'numeric', month:'long', year:'numeric'})
        : null;

      const resaData = {
          date_id: slotIds,
          type_resa: typeResaLabel,
          date_fin: dateFinLabel || null,
          date_texte: datesLbl,
          horaires: start + ' – ' + end,
          sports: sports,
          nb_educateurs: selProfs.length || resaEduc,
          profs: selProfs.join(', ') || 'Non précisé',
          participants: document.getElementById('parts-input').value || 'Non précisé',
          duree_facturee: dureeFacturee + 'h par séance',
          prix_estime: document.getElementById('rr-prix').textContent,
          contact_nom: nom,
          contact_commune: commune,
          contact_email: email,
          contact_tel: tel || 'Non renseigné',
          message: document.getElementById('conf-msg').value.trim(),
          statut: 'en_attente',
          timestamp_demande: new Date().toISOString()
      };

      // Sauvegarder dans Firebase
      var docRef = await window.addDoc(window.collection(window.db, "reservations"), resaData);

      // Email de confirmation au CLIENT
      try {
        var emailResult = await sendEmail('template_hbssga4', {
          to_email:   email,
          client_nom: nom,
          subject:    'NeoBall - Votre demande a bien ete recue',
          message:    'Nous avons bien recu votre demande pour ' + commune + '.\n'
                    + 'Date(s) : ' + datesLbl + '\n'
                    + 'Horaire : ' + start + ' - ' + end + '\n'
                    + 'Sport(s) : ' + sports + '\n'
                    + 'Éducateurs : ' + (selProfs.length ? selProfs.join(', ') : resaEduc) + '\n\n'
                    + 'Votre demande est en cours d\'etude. Reponse sous 48h.'
        });
        console.log('Email confirmation envoye avec succes:', emailResult.status, emailResult.text);
      } catch(emailErr) {
        console.error('ERREUR EMAIL - status:', emailErr.status, '| text:', emailErr.text, '| details:', JSON.stringify(emailErr));
      }

      document.getElementById('resa-ok').style.display='block';
      btn.style.display='none';

  } catch(error) {
      console.error('Erreur Firebase:', error);
      document.getElementById('resa-err').style.display='block';
      btn.disabled=false;
      document.getElementById('rf-next-txt').textContent='Réessayer';
  }
}

document.addEventListener('keydown',function(e){if(e.key==='Escape')closeResa();});

function sendContactForm() {
  var nom     = document.getElementById('cf-nom').value.trim();
  var commune = document.getElementById('cf-commune').value.trim();
  var email   = document.getElementById('cf-email').value.trim();
  var tel     = document.getElementById('cf-tel').value.trim();
  var message = document.getElementById('cf-message').value.trim();
  if (!nom || !commune || !email || !message) { alert('Merci de remplir les champs obligatoires.'); return; }
  var btn = document.getElementById('cf-btn');
  btn.disabled = true;
  document.getElementById('cf-btn-txt').textContent = 'Envoi en cours...';
  sendEmail('template_hbssga4', {
    to_email:   'neoball.collectif@gmail.com',
    client_nom: nom,
    subject:    'Message de ' + nom + ' (' + commune + ')',
    message:    'Commune : ' + commune + '\nEmail : ' + email + '\nTél : ' + (tel || 'Non renseigné') + '\n\n' + message
  }).then(function() {
    document.getElementById('cf-ok').style.display = 'block';
    btn.style.display = 'none';
  }).catch(function(e) {
    console.error('Email erreur:', e);
    document.getElementById('cf-err').style.display = 'block';
    btn.disabled = false;
    document.getElementById('cf-btn-txt').textContent = 'Réessayer →';
  });
}
