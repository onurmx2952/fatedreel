"""V2 research candidate. Specification fixed in MODEL_V2.md before experiments."""
from dataclasses import dataclass, replace
import math
import random
import numpy as np
import pandas as pd
from mesa import Model, Agent
from model import METRICS, LABELS, SCENARIOS, ROLES, classify, wilson

VERSION='2.0'
RATES=np.array([.055,.060,.140,.060,.050,.045])

def sigmoid(x):
    if x>=0:return 1/(1+math.exp(-x))
    z=math.exp(x);return z/(1+z)

def logit(p):return math.log(p)-math.log1p(-p)

@dataclass(frozen=True)
class Parameters:
    scenario:str='Devrim'
    resilience:float=1.
    shock_scale:float=1.
    protest_scale:float=1.
    leader_bias:float=0.
    self_feedback:float=1.
    conflict_resolution:float=1.
    def __post_init__(self):
        if self.scenario not in SCENARIOS:raise ValueError('Bilinmeyen senaryo')
        for key in ('resilience','shock_scale','protest_scale','self_feedback','conflict_resolution'):
            if not math.isfinite(getattr(self,key)) or not 0<=getattr(self,key)<=3:raise ValueError(key)
        if not math.isfinite(self.leader_bias) or not -.5<=self.leader_bias<=.5:raise ValueError('leader_bias')

def drives(x,micro,pressure,cycle,p):
    C,L,V,W,T,I=x;A,D,F,B,J,Q,S,agent_trust=micro;He,Hv,Hp=pressure
    G=(1-W)*(.4+.6*(1-L))
    # protest_scale=0 retains no endogenous protest pressure; hazard is bounded.
    P=1-math.exp(-p.protest_scale*math.log1p(math.exp(-2+2.5*G+F+.8*Hp))) if -2+2.5*G+F+.8*Hp<500 else 1.
    R=A*C*S;E=F*(1-T);K=L*I*(1-C);fb=p.self_feedback
    u=np.array([3*fb*(2*C-1)+2.2*(2*A-1)-1.8*p.resilience*(2*I-1)-.8*(2*D-1)+1.1*Hp+.9*V+.7*(E-.3)-K,
      2.5*fb*(2*L-1)-2.2*(2*C-1)+1.2*(2*I-1)+.8*(2*D-1)-1.2*R-.6*Hp,
      -3+1.5*G+1.5*F*(1-I)+2.8*Hv+1.7*R*P+3*V-1.5*p.conflict_resolution*I*T-S,
      .4+(2*B-1)+.5*I-.4*V-.4*C*A-1.4*He+.5*cycle,
      .2+1.2*(2*W-1)+(2*L-1)-1.5*V-.8*R-.5*F+.25*(2*agent_trust-1),
      2.4*fb*(2*I-1)-2*(2*C-1)+1.2*p.resilience*(2*J-1)+.6*K-.8*C*A+.5*(2*Q-1)-.5*Hp])
    return u,P

def flow_map(x,micro,pressure,cycle,p,innovation=None):
    u,P=drives(x,micro,pressure,cycle,p)
    if innovation is not None:u=u+np.asarray(innovation)
    targets=np.array([sigmoid(float(v)) for v in u])
    return (1-RATES)*np.asarray(x)+RATES*targets

class SocialAgent(Agent):
    def __init__(self,model,role,resource_mean):
        super().__init__(model);r=model.random
        self.role=role;self.ideal=r.betavariate(2,2);self.preference=self.ideal
        self.hard_ideal=r.betavariate(2,2)
        if role in ('Lider','Fraksiyon'):self.hard_ideal=sigmoid(logit(self.hard_ideal)+4*model.params.leader_bias)
        self.hardness=self.hard_ideal;self.norm=r.betavariate(2,2)
        self.resources=r.betavariate(5*resource_mean,5*(1-resource_mean));self.resource_anchor=logit(resource_mean)
        t=model.state['trust'];self.trust=r.betavariate(8*t,8*(1-t));self.allies=set()
    def step(self):
        m=self.model;r=m.random;peer=r.choice(m.people);s=m.state;C,L,V,W,T,I=[s[k] for k in METRICS]
        gap=abs(self.preference-peer.preference)
        if peer is not self:
            if gap<.25:self.allies.add(peer.unique_id);peer.allies.add(self.unique_id)
            elif gap>.55:self.allies.discard(peer.unique_id);peer.allies.discard(self.unique_id)
            eta=.025 if gap<.25 else .005
            self.preference=(1-eta)*self.preference+eta*peer.preference
        experience=sigmoid(logit(self.ideal)+.5*(W-.5)+.5*(L-.5))
        self.preference=.99*self.preference+.01*experience
        self.trust=.96*self.trust+.04*sigmoid(.4+1.3*(2*T-1)+.5*(2*W-1)-1.2*V+r.gauss(0,.15))
        self.hardness=.975*self.hardness+.025*sigmoid(logit(self.hard_ideal)+.8*(C-.5)*(1-self.norm)-.8*m.protest_pressure*self.norm)
        payoff={'Vatandaş':1.2*(W-.5)+.3*(L-.5)-.5*V,'İşletme':1.6*(W-.5)-.7*V,'Ordu':(C-.5)-.4*V,'Polis':(C-.5)-.4*V,'Yargı':1.4*(I-.5),'Bürokrasi':(W-.5)+.6*(I-.5),'Muhalefet':1.2*(L-.5),'Lider':1.2*(C-.5)+.8*(1-self.norm)*C,'Fraksiyon':1.2*(C-.5)+.8*(1-self.norm)*C}[self.role]
        self.resources=.94*self.resources+.06*sigmoid(self.resource_anchor+payoff+r.gauss(0,.10))

class RevolutionModel(Model):
    def __init__(self,seed=2026,params=None):
        super().__init__(rng=seed);self.params=params or Parameters();self.seed_value=seed
        self.events_rng=random.Random(seed+10000019);self.macro_rng=random.Random(seed+20000033);self.leader_rng=random.Random(seed+30000047)
        self.month=0;self.events=[];self.history=[];self.diagnostics=[]
        self.state=dict(zip(METRICS,SCENARIOS[self.params.scenario]));self.pressure=np.zeros(3);self.protest_pressure=0.
        self.period=self.macro_rng.uniform(48,96);self.phase=self.macro_rng.uniform(0,2*math.pi)
        for role,(count,_,resources) in ROLES.items():
            for _ in range(count):SocialAgent(self,role,resources)
        self.people=list(self.agents);self.groups={role:[a for a in self.people if a.role==role] for role in ROLES}
        self.leader=self.groups['Lider'][0];self.record()
    def record(self):self.history.append({'month':self.month,**self.state})
    def event(self,text):self.events.append({'month':self.month,'year':2026+(self.month-1)//12,'event':text})
    def aggregates(self):
        co=self.groups['Lider']+self.groups['Fraksiyon'];w=[a.resources*(1+len(a.allies)/len(self.people)) for a in co]
        A=.7*self.leader.hardness+.3*sum(a.hardness*z for a,z in zip(co,w))/sum(w)
        avg=lambda agents,key:sum(getattr(a,key) for a in agents)/len(agents)
        F=2*float(np.std([a.preference for a in self.groups['Fraksiyon']]))
        return np.array([A,avg(self.groups['Vatandaş']+self.groups['Muhalefet'],'preference'),F,avg(self.groups['İşletme'],'resources'),avg(self.groups['Yargı'],'norm'),avg(self.groups['Yargı'],'resources'),avg(self.groups['Ordu']+self.groups['Polis'],'resources'),avg(self.people,'trust')])
    def update_pressures(self):
        r=self.events_rng;p=self.params
        draws=[r.random() for _ in range(5)];innovation=np.array([r.gauss(0,.06) for _ in range(3)])
        impulses=np.zeros(3)
        specs=[(.012*p.shock_scale,0,'Ekonomik kriz kalıcı üretim baskısı oluşturdu.',(.9,0,0)),(.006*p.shock_scale,1,'Kıtlık ekonomik ve toplumsal gerilimi artırdı.',(.8,.3,0)),(.004*p.shock_scale,2,'Dış müdahale çatışma ve üretim baskısı oluşturdu.',(.3,.9,0)),(.008,3,'Elit koalisyonundaki bölünme siyasi baskıyı artırdı.',(0,0,.8))]
        for prob,index,text,impulse in specs:
            if draws[index]<prob:impulses+=np.array(impulse);self.event(text)
        self.pressure=.94*self.pressure+impulses+innovation
        return draws[4]
    def update_leader(self):
        r=self.leader_rng;u=r.random();choice_u=r.random();new_ideal=r.betavariate(2,2)
        C,L,_,_,_,I=[self.state[k] for k in METRICS];K=L*I*(1-C)
        if u<.008+.012*K:
            D=self.aggregates()[1];candidates=[a for a in self.groups['Lider'] if a is not self.leader]
            weights=[.1+a.resources*(1+len(a.allies)/len(self.people))*(1-K*abs(a.preference-D)) for a in candidates]
            self.leader=candidates[0] if choice_u*sum(weights)<weights[0] else candidates[1]
            self.leader.hard_ideal=sigmoid(logit(new_ideal)+4*self.params.leader_bias)
            self.event('Lider değişimi koalisyonun siyasi stratejisini değiştirdi.')
    def step(self):
        self.month+=1;self.agents.shuffle_do('step');protest_draw=self.update_pressures();self.update_leader()
        x=np.array([self.state[k] for k in METRICS]);micro=self.aggregates();cycle=math.sin(2*math.pi*self.month/self.period+self.phase)
        _,self.protest_pressure=drives(x,micro,self.pressure,cycle,self.params)
        if protest_draw<self.protest_pressure:self.event('Toplumsal protestolar gerçekleşti.')
        innovation=[self.macro_rng.gauss(0,.18) for _ in range(6)]
        y=flow_map(x,micro,self.pressure,cycle,self.params,innovation)
        self.state=dict(zip(METRICS,map(float,y)));self.record()
        self.diagnostics.append({'month':self.month,'economic_pressure':float(self.pressure[0]),'conflict_pressure':float(self.pressure[1]),'political_pressure':float(self.pressure[2]),'A':float(micro[0]),'D':float(micro[1]),'F':float(micro[2]),'protest_pressure':self.protest_pressure})
    def run(self,months=240):
        for _ in range(months):self.step()
        return pd.DataFrame(self.history),pd.DataFrame(self.events,columns=['month','year','event'])

def experiment(params=None,runs=100,base_seed=2026,months=240,progress=None):
    if not 1<=runs<=1000 or not 1<=months<=240:raise ValueError('Deney boyutu')
    params=params or Parameters();histories=[];events=[];outcomes=[]
    for i in range(runs):
        seed=base_seed+i;m=RevolutionModel(seed,params);h,e=m.run(months)
        h['run']=i;h['seed']=seed;e['run']=i;e['seed']=seed;histories.append(h);events.append(e)
        late=h.tail(min(60,months));rolling=h.violence.rolling(12,min_periods=12).mean()
        outcomes.append({'run':i,'seed':seed,'regime':classify(h),**h.iloc[-1][METRICS].to_dict(),**{'mean12_'+k:float(h.tail(12)[k].mean()) for k in METRICS},'late_mean_sd':float(late[METRICS].std().mean()),'sustained_high_violence':bool((rolling>=.4).any()),'mean_violence':float(h.violence.mean())})
        if progress:progress((i+1)/runs)
    return pd.concat(histories,ignore_index=True),pd.concat(events,ignore_index=True),pd.DataFrame(outcomes)

def sensitivity(params,runs=100,seed=2026,progress=None):
    _,_,baseline=experiment(params,runs,seed);base=(baseline.regime=='Otoriter').astype(int).to_numpy();rows=[]
    variants=[('resilience',.5),('resilience',1.5),('shock_scale',0.),('shock_scale',1.5),('leader_bias',-.25),('leader_bias',.25),('self_feedback',.5),('self_feedback',1.5),('conflict_resolution',.5),('conflict_resolution',1.5)]
    for j,(key,value) in enumerate(variants):
        _,_,o=experiment(replace(params,**{key:value}),runs,seed);y=(o.regime=='Otoriter').astype(int).to_numpy();delta=y-base
        rows.append({'parameter':key,'value':value,'authoritarian_rate':float(y.mean()),'paired_difference':float(delta.mean()),'paired_mc_se':float(delta.std(ddof=1)/math.sqrt(runs)) if runs>1 else None,'distribution':o.regime.value_counts().to_dict(),'mean_violence':float(o.mean_violence.mean()),'sustained_high_violence_rate':float(o.sustained_high_violence.mean())})
        if progress:progress((j+1)/len(variants))
    return pd.DataFrame(rows)
