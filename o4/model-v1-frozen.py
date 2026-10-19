from dataclasses import dataclass, asdict, replace
import math
import numpy as np
import pandas as pd
from mesa import Agent, Model

METRICS = ['concentration','liberties','violence','prosperity','trust','independence']
LABELS = dict(zip(METRICS,['İktidar yoğunlaşması','Özgürlükler','Siyasal şiddet','Ekonomik refah','Toplumsal güven','Kurumların bağımsızlığı']))
SCENARIOS = {'Devrim':(.55,.50,.15,.55,.42,.45),'Uzlaşma':(.35,.65,.08,.60,.60,.65),'Parçalanma':(.65,.35,.28,.42,.28,.25),'Kurumların devamı':(.30,.75,.04,.65,.60,.75)}
ROLES = {'Vatandaş':(120,.65,.35),'Fraksiyon':(5,.45,.65),'Lider':(3,.40,.75),'Ordu':(2,.30,.85),'Polis':(3,.35,.70),'Bürokrasi':(6,.55,.60),'Yargı':(4,.80,.55),'İşletme':(12,.55,.80),'Muhalefet':(5,.80,.40)}
def clip(x): return float(max(0,min(1,x)))
@dataclass(frozen=True)
class Parameters:
    scenario: str = 'Devrim'
    resilience: float = 1.0
    shock_scale: float = 1.0
    protest_scale: float = 1.0
    leader_bias: float = 0.0
    def __post_init__(self):
        if self.scenario not in SCENARIOS: raise ValueError('Bilinmeyen senaryo')
        for k in ('resilience','shock_scale','protest_scale'):
            if not 0 <= getattr(self,k) <= 3: raise ValueError(k)
        if not -.5 <= self.leader_bias <= .5: raise ValueError('leader_bias')

class PoliticalAgent(Agent):
    def __init__(self, model, role, preference, resources):
        super().__init__(model)
        self.role=role
        self.preference=clip(model.random.gauss(preference,.17))
        self.resources=clip(model.random.gauss(resources,.14))
        self.trust=clip(model.random.gauss(model.state['trust'],.15))
        self.hardness=clip(1-self.preference+model.random.gauss(0,.12)+(model.params.leader_bias if role in ('Lider','Fraksiyon') else 0))
        self.allies=set()
    def step(self):
        m=self.model; peer=m.random.choice(m.people)
        if peer is not self:
            gap=abs(self.preference-peer.preference)
            if gap<.25:
                self.allies.add(peer.unique_id); peer.allies.add(self.unique_id)
            elif gap>.55:
                self.allies.discard(peer.unique_id); peer.allies.discard(self.unique_id)
            self.preference=clip(self.preference+(.04 if gap<.25 else -.01)*(peer.preference-self.preference))
        s=m.state
        self.trust=clip(self.trust+.03*(s['trust']-self.trust)-.025*s['violence'])
        extra={'İşletme':.015*s['prosperity'],'Ordu':.012*s['concentration'],'Polis':.012*s['concentration'],'Yargı':.012*s['independence'],'Muhalefet':.012*s['liberties']}.get(self.role,0)
        self.resources=clip(self.resources+.025*(s['prosperity']-.5)-.02*s['violence']+extra+m.random.uniform(-.008,.008))

class RevolutionModel(Model):
    def __init__(self, seed=2026, params=None):
        super().__init__(rng=seed)
        self.params=params or Parameters(); self.seed_value=seed
        self.state=dict(zip(METRICS,SCENARIOS[self.params.scenario]))
        self.month=0; self.events=[]; self.history=[]
        for role,(count,p,r) in ROLES.items():
            for _ in range(count): PoliticalAgent(self,role,p,r)
        self.people=list(self.agents)
        self.leader=next(a for a in self.people if a.role=='Lider')
        self.record()
    def record(self): self.history.append({'month':self.month,**self.state})
    def event(self,name): self.events.append({'month':self.month,'year':2026+(self.month-1)//12,'event':name})
    def step(self):
        self.month+=1
        self.agents.shuffle_do('step')
        s=self.state; C,L,V,W,T,I=[s[k] for k in METRICS]; p=self.params
        if self.month%12==0:
            previous=self.leader
            self.leader=max((a for a in self.people if a.role=='Lider'),key=lambda a:a.resources*(1+len(a.allies)))
            if self.leader is not previous: self.event('Koalisyon görüşmeleri sonucunda siyasi lider değişti.')
        dw=dv=0.
        for prob,name,w,v in [(.012,'Ekonomik kriz üretimi ve refahı düşürdü.',-.14,0),(.006,'Kıtlık toplumsal baskıyı artırdı.',-.10,.035),(.004,'Dış müdahale ekonomik ve siyasi gerilimi artırdı.',-.06,.08)]:
            if self.random.random()<prob*p.shock_scale: dw+=w;dv+=v;self.event(name)
        if self.random.random()<.008:
            self.leader.hardness=self.random.random();self.event('Lider değişimi koalisyonun siyasi yönelimini değiştirdi.')
        protest=self.random.random()<clip(.015+p.protest_scale*(1-W)*(1-T)*.22)
        if protest:self.event('Toplumsal protestolar gerçekleşti.')
        coalition=[a for a in self.people if a.role in ('Lider','Fraksiyon')]
        weights=[a.resources*(1+len(a.allies))+.01 for a in coalition]
        A=sum(a.hardness*w for a,w in zip(coalition,weights))/sum(weights)
        A=(A+self.leader.hardness)/2
        D=float(np.mean([a.preference for a in self.people if a.role in ('Vatandaş','Muhalefet')]))
        S=float(np.mean([a.trust*a.resources for a in self.people if a.role in ('Ordu','Polis')]))
        F=clip(2*np.std([a.preference for a in coalition]))
        B=float(np.mean([a.resources for a in self.people if a.role=='İşletme']))
        n=lambda sd:self.random.gauss(0,sd)
        values=[C+.035*(A-.5)+.025*V+.018*protest*S-.035*I*D+n(.008), L+.035*I*D-.030*C*A-.020*protest*S+n(.008), .90*V+.045*protest*(1-L)+.035*F*(1-T)+dv-.025*T*I, W+.018*(.65-W)+.012*T+.008*B-.025*V-.012*C*(1-I)+dw+n(.006), T+.020*(W-.5)+.012*L*I-.025*V-.010*protest+n(.006), I+p.resilience*(.6-C)*.035-.020*C*A+n(.006)]
        self.state=dict(zip(METRICS,map(clip,values)));self.record()
    def run(self,months=240):
        for _ in range(months):self.step()
        return pd.DataFrame(self.history),pd.DataFrame(self.events,columns=['month','year','event'])

def classify(frame):
    s=frame.tail(12)[METRICS].mean()
    if s.violence>=.60:return 'İç savaş'
    if s.concentration>=.70 and s.liberties<=.35 and s.independence<=.35:return 'Otoriter'
    if s.concentration<=.45 and s.liberties>=.65 and s.independence>=.60 and s.violence<.20:return 'Demokrasi'
    if s.independence<.30:return 'Kırılgan yönetim'
    return 'Hibrit'

def experiment(params=Parameters(),runs=100,base_seed=2026,months=240,progress=None):
    histories=[];events=[];outcomes=[]
    if not 1<=runs<=1000 or not 1<=months<=240:raise ValueError('Deney boyutu')
    for i in range(runs):
        seed=base_seed+i;m=RevolutionModel(seed,params);h,e=m.run(months)
        h['run']=i;h['seed']=seed;e['run']=i;e['seed']=seed
        histories.append(h);events.append(e)
        outcomes.append({'run':i,'seed':seed,'regime':classify(h),**h.iloc[-1][METRICS].to_dict()})
        if progress:progress((i+1)/runs)
    return pd.concat(histories,ignore_index=True),pd.concat(events,ignore_index=True),pd.DataFrame(outcomes)

def wilson(k,n):
    z=1.96;p=k/n;d=1+z*z/n
    center=(p+z*z/(2*n))/d;half=z*math.sqrt(p*(1-p)/n+z*z/(4*n*n))/d
    return max(0,center-half),min(1,center+half)

def sensitivity(params,runs=100,seed=2026,progress=None):
    _,_,baseline=experiment(params,runs,seed)
    base=(baseline.regime=='Otoriter').astype(int).to_numpy(); rows=[]
    variants=[('resilience',.5),('resilience',1.5),('shock_scale',.5),('shock_scale',1.5),('protest_scale',.5),('protest_scale',1.5),('leader_bias',-.25),('leader_bias',.25)]
    for j,(key,value) in enumerate(variants):
        _,_,out=experiment(replace(params,**{key:value}),runs,seed)
        y=(out.regime=='Otoriter').astype(int).to_numpy();delta=y-base
        rows.append({'parameter':key,'value':value,'authoritarian_rate':float(y.mean()),'paired_difference':float(delta.mean()),'paired_mc_se':float(delta.std(ddof=1)/np.sqrt(runs)) if runs>1 else None})
        if progress:progress((j+1)/len(variants))
    return pd.DataFrame(rows)
