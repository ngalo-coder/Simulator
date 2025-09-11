import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import renderWithRouter from '../../test-utils'
import { act } from 'react'
import SimulationChatPage from '../SimulationChatPage'
import * as apiService from '../../services/apiService'
import * as urlUtils from '../../utils/urlUtils'

// Mock the API service
vi.mock('../../services/apiService', () => ({
  api: {
    startSimulation: vi.fn(),
    endSimulation: vi.fn(),
  }
}))

// Mock the URL utils
vi.mock('../../utils/urlUtils', () => ({
  createSimulationSessionUrl: vi.fn(),
  createSimulationCaseUrl: vi.fn(),
  parseSimulationUrl: vi.fn(),
  createSpecialtyContext: vi.fn(),
  preserveSpecialtyContext: vi.fn(),
  updateBrowserHistoryForBookmarks: vi.fn(),
  isValidSimulationUrl: vi.fn()
}))

// Mock the useAuth hook
vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: '1', name: 'Test User' },
    isAuthenticated: true
  })
}))

// Mock EventSource
const mockEventSource = {
  close: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
  onopen: null,
  onmessage: null,
  onerror: null,
  readyState: 1,
  url: '',
  withCredentials: false,
  CONNECTING: 0,
  OPEN: 1,
  CLOSED: 2
}

global.EventSource = vi.fn(() => mockEventSource) as any

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
})

// Mock console methods to avoid noise in tests
const originalConsole = { ...console }
beforeEach(() => {
  console.log = vi.fn()
  console.error = vi.fn()
  console.warn = vi.fn()
})

afterEach(() => {
  Object.assign(console, originalConsole)
  vi.clearAllMocks()
})

describe('SimulationChatPage - Route Matching and Component Logic', () => {
  beforeEach(() => {
    // Setup default mocks
    mockLocalStorage.getItem.mockReturnValue('mock-auth-token')
    
    // Default URL utils mocks
    vi.mocked(urlUtils.parseSimulationUrl).mockReturnValue({
      isValid: true,
      caseId: 'VP-OPTH-001',
      sessionId: null
    })
    
    vi.mocked(urlUtils.isValidSimulationUrl).mockReturnValue(true)
    vi.mocked(urlUtils.createSimulationSessionUrl).mockReturnValue('/simulation/VP-OPTH-001/session/123')
    vi.mocked(urlUtils.createSimulationCaseUrl).mockReturnValue('/simulation/VP-OPTH-001')
    vi.mocked(urlUtils.preserveSpecialtyContext).mockReturnValue({
      specialtyContext: { name: 'Ophthalmology', returnUrl: '/ophthalmology' }
    })
    vi.mocked(urlUtils.createSpecialtyContext).mockReturnValue({
      name: 'General',
      returnUrl: '/simulation'
    })
  })

  describe('Route Matching Behavior', () => {
    it('should handle case-only URL pattern correctly', async () => {
      // Test Requirements: 1.1 - Direct case access
      const mockStartSimulation = vi.mocked(apiService.api.startSimulation)
      mockStartSimulation.mockResolvedValue({
        sessionId: 'session-123',
        patientName: 'John Doe',
        initialPrompt: 'Hello, I have been experiencing eye pain.',
        speaks_for: 'John Doe'
      })

      renderWithRouter(<SimulationChatPage />, { initialEntries: ['/simulation/VP-OPTH-001'] })

      // Verify URL parsing was called
      expect(urlUtils.parseSimulationUrl).toHaveBeenCalledWith('/simulation/VP-OPTH-001')
      
      // Wait for simulation to start
      await waitFor(() => {
        expect(mockStartSimulation).toHaveBeenCalledWith('VP-OPTH-001')
      })

      // Verify session URL creation
      expect(urlUtils.createSimulationSessionUrl).toHaveBeenCalledWith('VP-OPTH-001', 'session-123')
    })

    it('should handle case-with-session URL pattern correctly', async () => {
      // Test Requirements: 4.2 - Session URL access
      vi.mocked(urlUtils.parseSimulationUrl).mockReturnValue({
        isValid: true,
        caseId: 'VP-OPTH-001',
        sessionId: 'session-123'
      })

      const mockStartSimulation = vi.mocked(apiService.api.startSimulation)

      renderWithRouter(<SimulationChatPage />, { initialEntries: ['/simulation/VP-OPTH-001/session/session-123'] })

      // Should not start a new simulation for existing session
      await waitFor(() => {
        expect(mockStartSimulation).not.toHaveBeenCalled()
      })

      // Verify URL parsing was called with session URL
      expect(urlUtils.parseSimulationUrl).toHaveBeenCalledWith('/simulation/VP-OPTH-001/session/session-123')
    })

    it('should handle invalid URL patterns correctly', async () => {
      // Test Requirements: 3.3 - Invalid case handling
      vi.mocked(urlUtils.parseSimulationUrl).mockReturnValue({
        isValid: false,
        caseId: null,
        sessionId: null
      })

      renderWithRouter(<SimulationChatPage />, { initialEntries: ['/simulation/invalid-url'] })

      // Should show error for invalid URL
      await waitFor(() => {
        expect(screen.getByText(/Invalid simulation URL/)).toBeInTheDocument()
      })
    })

    it('should validate bookmark compatibility', async () => {
      // Test Requirements: 4.4 - Bookmark compatibility
      renderWithRouter(<SimulationChatPage />, { initialEntries: ['/simulation/VP-OPTH-001'] })

      // Verify bookmark validation functions are called
      expect(urlUtils.isValidSimulationUrl).toHaveBeenCalled()
      expect(urlUtils.parseSimulationUrl).toHaveBeenCalled()
    })
  })

  describe('Component Logic with Different URL Parameters', () => {
    it('should automatically start simulation for case-only URLs', async () => {
      // Test Requirements: 1.1, 1.2 - Automatic simulation startup
      const mockStartSimulation = vi.mocked(apiService.api.startSimulation)
      mockStartSimulation.mockResolvedValue({
        sessionId: 'new-session-123',
        patientName: 'Jane Smith',
        initialPrompt: 'I have been having headaches.',
        speaks_for: 'Jane Smith'
      })

      renderWithRouter(<SimulationChatPage />, { initialEntries: ['/simulation/VP-NEURO-001'] })

      // Should show loading state initially
      await waitFor(() => {
        expect(screen.getByText(/Validating case/)).toBeInTheDocument()
      })

      // Wait for simulation to complete
      await waitFor(() => {
        expect(mockStartSimulation).toHaveBeenCalledWith('VP-NEURO-001')
      })

      // Should show patient name and initial prompt
      await waitFor(() => {
        expect(screen.getByText(/Jane Smith/)).toBeInTheDocument()
        expect(screen.getByText(/I have been having headaches/)).toBeInTheDocument()
      })
    })

    it('should handle missing initial prompt with default greeting', async () => {
      // Test Requirements: 2.2 - Default greeting when no initial prompt
      const mockStartSimulation = vi.mocked(apiService.api.startSimulation)
      mockStartSimulation.mockResolvedValue({
        sessionId: 'session-456',
        patientName: 'Bob Wilson',
        initialPrompt: '', // Empty initial prompt
        speaks_for: 'Bob Wilson'
      })

      renderWithRouter(<SimulationChatPage />, { initialEntries: ['/simulation/VP-CARD-001'] })

      await waitFor(() => {
        expect(mockStartSimulation).toHaveBeenCalledWith('VP-CARD-001')
      })

      // Should show default greeting
      await waitFor(() => {
        expect(screen.getByText(/Hello, I'm Bob Wilson/)).toBeInTheDocument()
        expect(screen.getByText(/Thank you for seeing me today/)).toBeInTheDocument()
      })
    })

    it('should preserve specialty context during navigation', async () => {
      // Test Requirements: 4.1, 4.2 - Specialty context preservation
      const specialtyState = {
        specialtyContext: {
          name: 'Cardiology',
          returnUrl: '/cardiology'
        }
      }

      const mockStartSimulation = vi.mocked(apiService.api.startSimulation)
      mockStartSimulation.mockResolvedValue({
        sessionId: 'session-789',
        patientName: 'Alice Johnson',
        initialPrompt: 'I have chest pain.',
        speaks_for: 'Alice Johnson'
      })

      renderWithRouter(<SimulationChatPage />, { initialEntries: [{ pathname: '/simulation/VP-CARD-002', state: specialtyState }] })

      await waitFor(() => {
        expect(mockStartSimulation).toHaveBeenCalledWith('VP-CARD-002')
      })

      // Verify specialty context preservation
      expect(urlUtils.preserveSpecialtyContext).toHaveBeenCalledWith(
        specialtyState,
        expect.objectContaining({
          fromCaseOnlyUrl: true
        })
      )
    })

    it('should update URL to session format after successful startup', async () => {
      // Test Requirements: 1.2, 4.4 - URL redirection and consistency
      const mockStartSimulation = vi.mocked(apiService.api.startSimulation)
      mockStartSimulation.mockResolvedValue({
        sessionId: 'session-redirect-123',
        patientName: 'Test Patient',
        initialPrompt: 'Test prompt',
        speaks_for: 'Test Patient'
      })

      renderWithRouter(<SimulationChatPage />, { initialEntries: ['/simulation/VP-TEST-001'] })

      await waitFor(() => {
        expect(mockStartSimulation).toHaveBeenCalledWith('VP-TEST-001')
      })

      // Verify URL utilities were called for redirection
      expect(urlUtils.createSimulationSessionUrl).toHaveBeenCalledWith('VP-TEST-001', 'session-redirect-123')
      expect(urlUtils.updateBrowserHistoryForBookmarks).toHaveBeenCalled()
    })
  })

  describe('Loading States and User Feedback', () => {
    it('should show progressive loading states during simulation startup', async () => {
      // Test Requirements: 2.2, 2.3, 2.4 - Loading states and progress
      const mockStartSimulation = vi.mocked(apiService.api.startSimulation)
      mockStartSimulation.mockImplementation(() => 
        new Promise(resolve => {
          setTimeout(() => {
            resolve({
              sessionId: 'loading-test-123',
              patientName: 'Loading Test Patient',
              initialPrompt: 'Loading test prompt',
              speaks_for: 'Loading Test Patient'
            })
          }, 100)
        })
      )

      renderWithRouter(<SimulationChatPage />, { initialEntries: ['/simulation/VP-LOAD-001'] })

      // Should show initial validation phase
      expect(screen.getByText(/Validating case VP-LOAD-001/)).toBeInTheDocument()

      // Wait for progression through loading phases
      await waitFor(() => {
        expect(screen.getByText(/Creating new simulation session/)).toBeInTheDocument()
      })

      await waitFor(() => {
        expect(screen.getByText(/Loading patient information/)).toBeInTheDocument()
      })

      await waitFor(() => {
        expect(screen.getByText(/Preparing chat interface/)).toBeInTheDocument()
      })

      // Finally should complete
      await waitFor(() => {
        expect(mockStartSimulation).toHaveBeenCalledWith('VP-LOAD-001')
      })
    })

    it('should enable chat input when simulation is ready', async () => {
      // Test Requirements: 2.4 - Chat interface availability
      const mockStartSimulation = vi.mocked(apiService.api.startSimulation)
      mockStartSimulation.mockResolvedValue({
        sessionId: 'ready-test-123',
        patientName: 'Ready Test Patient',
        initialPrompt: 'Ready to chat!',
        speaks_for: 'Ready Test Patient'
      })

      renderWithRouter(<SimulationChatPage />, { initialEntries: ['/simulation/VP-READY-001'] })

      await waitFor(() => {
        expect(mockStartSimulation).toHaveBeenCalledWith('VP-READY-001')
      })

      // Chat input should be enabled
      await waitFor(() => {
        const chatInput = screen.getByPlaceholderText(/Type your message/)
        expect(chatInput).toBeInTheDocument()
        expect(chatInput).not.toBeDisabled()
      })
    })
  })
})  desc
ribe('Error Handling Scenarios and State Transitions', () => {
    it('should handle invalid case ID errors correctly', async () => {
      // Test Requirements: 3.3 - Invalid case error handling
      const mockStartSimulation = vi.mocked(apiService.api.startSimulation)
      mockStartSimulation.mockRejectedValue(new Error('Case not found'))

      renderWithRouter(<SimulationChatPage />, { initialEntries: ['/simulation/INVALID-CASE'] })

      await waitFor(() => {
        expect(mockStartSimulation).toHaveBeenCalledWith('INVALID-CASE')
      }})  })
})
    })
   )
         )
  ectbjt.any(O     expec
     d'),ch detecteismatr maramete'URL pContaining(stringt.      expec    alledWith(
eBeenC.toHavn)nsole.wart(coexpec{
        (() => it waitFor     awaatch
 smbout mi awarning Should log 

      //     )r>
 teryRou/Memo   <    >
 onChatPage /latimu       <Si01']}>
   SMATCH-0n/VP-MIatio/simuls={['iealEntrRouter initi     <Memorynder(
     re

      })null
    essionId: 
        sFERENT-001',d: 'VP-DIF      caseI true,
  sValid:{
        ialue(eturnVckR).moonUrlimulati.parseS(urlUtilsocked      vi.mh
matct params don'nd route  arsingwhere URL pase t edge ca// Tes   
   () => {c yn asismatches', mmetere URL paraandlhould hit('s
      })

  })  d()
    enCalleaveBe.not.toHn)Simulatioi.startvice.appiSerexpect(a
        ) => {it waitFor((wa  a
    ssionexisting setion for t new simula starnot// Should  )

      ter>
     Rouoryem      </Mge />
  lationChatPamu<Si
          3']}>on-12sting-session/exissi2/seERN-00on/VP-PATTulati{['/simalEntries=ter initiryRou  <Memo    
  ender(

      r  })
    on-123'isting-sessiionId: 'exss
        seERN-002',P-PATT caseId: 'V   
    rue,alid: tisV{
        alue(ReturnVrl).mockionUparseSimulatrlUtils.i.mocked(u vc
     on logiectipattern det/ Test URL      /=> {
 nc () attern', asyon URL pssiith-sey case-wy identiftlreccor it('should  })

       })
1')
     00'VP-PATTERN-nCalledWith(veBee).toHaationmuli.startSiice.apect(apiServ     exp() => {
   For( waitawait
      imulationstart stern and  patonly case-ould detect   // Sh      )


   emoryRouter></M     
   e />tionChatPagula<Sim         001']}>
 N-on/VP-PATTERimulatitries={['/salEninitimoryRouter 
        <Me    render(})

      : null
  ionId     sess001',
   RN-: 'VP-PATTEeId    cas
    id: true,     isVal{
   lue(mockReturnVaonUrl).latimurseSirlUtils.pad(u.mockec
      viction logipattern dete Test URL 
      // () => { asyncRL pattern',e-only Uy casdentifectly i corr'should> {
    it(n', () =rn Detectioccess Pattecribe('URL A)

  des
  } })
    })nt()
     heDocumenTver/)).toBeIed from serceiv ID re sessionxt(/NoyTetBct(screen.geexpe   {
      For(() => await waity
     racefull gssionId semissinge d handlhoul/ S /

     
      })MED-001')('VP-MALFORledWithoHaveBeenCalulation).tkStartSim  expect(moc=> {
      ) tFor((ait wai

      aw )ter>
     MemoryRou</      />
  age nChatPtio    <Simula}>
      01']RMED-0LFOtion/VP-MA'/simulantries={[ter initialEmoryRou      <Me
      render(

  as any)    } 
   prompt''Test: omptinitialPr     tient',
   onse Pasped Relform'Mae: Namnttie  paonId
      uired sessising req // Mis       ({
dValuemockResolvetion.tSimulackStar      mo
Simulation)ce.api.startapiServimocked(= vi.imulation kStartS const moc     ng
andlise hed responrm 3.1 - Malfoquirements:/ Test Re      /
=> { async () ly',fulaceonses grmed API resplforld handle mat('shou
    i)
 })
    }ent()
     nTheDocumBeI.toded/)) was provi case IDt(/Noeen.getByTexscrexpect(       {
 r(() => itFo wa     awaitase ID
  csingr mis fow errorsho Should     //  )

    
  ter>emoryRou    </Mge />
    nChatPalatio  <Simu}>
        ']n/tiolas={['/simuietialEntrnioryRouter i       <Memr(
 de
      renlingse ID handissing ca3 - M 3.quirements:  // Test Re     () => {
URL', async ID in sing caseandle misshould hit('       })

 cument()
nTheDo)).not.toBeIfailed/tion ConnecByText(/uery(screen.q expectred
     cleabe  should  messagerror      // E      })

)
heDocument(toBeInTessful!/)).covery succReyText(/tBreen.ge(sc expect       ument()
oceInTheDtoBatient/)).ery P(/RecovtByTexten.gexpect(scre  e{
      => () or(t waitF      awaily succeed
entualould ev Sh

      //)
      }ocument()nTheD.toBeI))e/ating cas(/ValidyTextcreen.getBexpect(s        => {
aitFor(()      await win
 e againg statow loadould sh     // Shn)

 Butto.click(retry fireEvent)
      Again/(/Try.getByTextenon = screryButtonst ret   ctry
   / Click re
      /})
()
      ocumentTheDeIniled/)).toBtion fat(/ConnecyTextBen.ge expect(scre {
       r(() =>waitFo   await l error
   itia Wait for in //

         )outer>
  oryR   </Mem
     age />ationChatPul   <Sim>
       OVERY-001']}n/VP-REC'/simulatio{[s=lEntrieuter initiaryRomo<Me       
 nder(

      re       })ent'
 tiecovery Paor: 'R speaks_f
         essful!',ry succcovelPrompt: 'Re    initia,
      ent'ery PatiName: 'Recovent   pati
       very-123',nId: 'recoessio s         
ValueOnce({kResolved        .mocor'))
rrk eor('Networ Errce(newOnValueckRejected        .molation
tSimutar  mockSeds
    d succeils, seconcall fa/ First  /  
       n)
  tSimulatio.api.starServiceapid( vi.mockeation =artSimulconst mockStery
      ecovring error rns due transitio Stat4 -nts: 2.equiremeTest R      // => {
ync () , asy'coverr reroly during erorrectnsitions ce state traandl'should ht()

    i
    }
      })es(1)ledTimHaveBeenCalion).tortSimulatSta(mock  expect      der
e-rendespite rnce n oatioulrtSimy call sta/ Should onl      /(() => {
  ait waitFor  aw
       )

   >moryRouter      </Mee />
  atPagationChimul        <S1']}>
  00CE-lation/VP-RA'/simu{[lEntries=er initiamoryRout        <Meder(
rereng
      tinar still stmulation isile first sider whe-rengger r     // Tri)

 
      ter>MemoryRou     </age />
   ationChatP    <Simul]}>
      1'-RACE-00VPulation/imies={['/sialEntrer initout<MemoryR       nder(
 nder } = reret { recons)

        })
      )
      }, 100                })
 t'
     st Patiene Teacor: 'R_f  speaks       mpt',
      pro'Race test: Prompt initial       
       Patient',e TestRacName: 'nttie          pa  123',
  race-test-sessionId: '            ({
    resolve          ut(() => {
tTimeo  se    => {
     veesolew Promise(r 
        nation(() =>plementmockImulation.kStartSim
      mocSimulation)api.startice.rvSeapi.mocked(ion = vitartSimulatnst mockS    co
   conditionsrace prevent ge case: ed/ Test     /> {
 () =c s', asynlation startsimutaneous iple simulrevent multld p    it('shou)

 }   
      })
        )        })

  1'G-00Id: 'VP-LO case        ,
   failed'tup  star 'Simulationtype:         ({
   tainingjectCon   expect.ob),
       n Error:''🚨 Simulationtaining(tringCoect.sxp      e   h(
 nCalledWitee.toHaveBnsole.error)cot(ec  exp   ) => {
   r((t waitFo     awaicalled)
 e uld be.error shonsols logged (coor wa/ Verify err
      /     })
')
 01LOG-0h('VP-eenCalledWittoHaveBmulation).tartSixpect(mockS{
        e =>  waitFor(()    await

  
      )uter>ryRomo</Me/>
        age ulationChatP       <Sim  ]}>
 1'-00VP-LOGtion/'/simulas={[ntrieialEyRouter initmor <Meer(
       rend

      Error)edValue(testockRejectn.mlatioockStartSimu   mng')
   loggifor r ro('Test errrorror = new Enst testEr
      coation)ulapi.startSim(apiService.ed.mockvition = ulakStartSimnst moc
      coging - Error log3.4: ementsequirest R
      // T) => {c (oses', asynging purpr debugerrors fo'should log  it(  })

 ment()
    oBeInTheDocu).tn/)ry Agai(/T.getByTextpect(screen    ex errors
  r unknownn fotoetry butw rsho/ Should 

      /     })ocument()
 ).toBeInTheDpersists/)he problem  tt ifntact supporext(/coetByTt(screen.gpec     ex   ent()
TheDocumtoBeIn/)).urred occrorected er/An unexpgetByText(ect(screen.  exp> {
      aitFor(() = wait
      awr messageeneric errohould show g
      // S     })
)
 NOWN-001'NKP-Uh('VledWitoHaveBeenCal.ton)imulatiStartS expect(mock
        => {()or(ait waitF

      aw  )
    r>uteyRo </Memor    ge />
   onChatPalati  <Simu        >
WN-001']}on/VP-UNKNO{['/simulatiries=alEntitiryRouter in     <Memo
    render())

     occurred'known error w Error('UnedValue(nen.mockRejectulatiokStartSim    moc  
ation)imultStarice.api.srvd(apiSe vi.mockelation =imutartSt mockS  consng
    rror handli - Unknown es: 3.4nt Requiremeest   // T) => {
    (ly', asyncgracefulrs own errohandle unknhould    it('s)

 
    }ument()eInTheDocn/)).toBaiTry AgText(/reen.getBy  expect(scrrors
    t eouor timen fry butto retld show// Shou
      
})
      Document()oBeInThein/)).tase try aga/Plet(etByTexreen.gct(sc     expe()
   umentInTheDocoBe.to long/))ng toakiuest is te reqxt(/ThByTen.getexpect(scree {
        or(() => waitF  await  rror
  w timeout eld sho // Shou})

           
EOUT-001')'VP-TIMth(enCalledWiaveBeoHimulation).tt(mockStartSxpec
        etFor(() => {waiwait 

      a     )
 uter>emoryRo     </M
   ChatPage />onlatimu    <Si]}>
      OUT-001'tion/VP-TIME={['/simulatriesalEnr initiuteMemoryRo  <r(
      rende)

      outErroralue(timeedVejection.mockRrtSimulatSta      mockoutError'
me.name = 'TirrorutEmeo ti')
     imeout tstr('Reque = new ErroErrornst timeoutco     lation)
 muartSivice.api.stSerpicked(an = vi.moartSimulatioockStconst mng
      handlierror  Timeout s: 3.1 -ementuirst Req      // Te() => {
 async rectly',rs corimeout errondle thould ha
    it('s
    })
ument()nTheDoceIgain/)).toBxt(/Try Aeen.getByTecr    expect(ss
  er errorrvn for setry buttohow rehould s
      // S })
  
   )ocument(eDeInThts/)).toB a few momenagain in/Please try yText(creen.getB expect(s   ent()
    BeInTheDocum.tog issues/))eriencinis expThe server (/xtTetByscreen.get(  expec{
      or(() => ait waitF      aw error
ow serverhould sh
      // S
      })
RVER-001')-SEdWith('VPenCallen).toHaveBeulatiokStartSimexpect(moc
        > {r(() =itFowait      awa      )

 yRouter>
mor        </Me
ge />tionChatPaSimula          <}>
SERVER-001']n/VP-['/simulatioalEntries={uter initi<MemoryRo        ender(


      rver Error'))nal Ser('500 Interew ErrorValue(nedjecton.mockRetiartSimula  mockSton)
    latipi.startSimuapiService.a.mocked(ation = viartSimult mockStnsng
      codlianerror hr rves: 3.1 - SementRequire  // Test ) => {
    c ( asynlity',nctionah retry fu witrsrver errole seld hand('shou
    it)
nt()
    }eDocumeot.toBeInTh/)).ngainyText(/Try Acreen.queryBt(spec exrors
     or auth ertton f buw retryhoot sld n  // Shou
     })
     t()
nTheDocumen/)).toBeIinagaase log in xt(/PleyTecreen.getBpect(s ex      cument()
 heDotoBeInTred/)). expin has/Your session.getByText(xpect(scree       e {
 itFor(() => wa
      awaitn erroruthenticatioould show a
      // Sh
    })')
  AUTH-001ledWith('VP-oHaveBeenCalimulation).tStartSect(mockexp      ) => {
  itFor(( waawait   
    )
r>
     teRou </Memory
       tPage />ha<SimulationC          001']}>
VP-AUTH-lation/s={['/simuialEntrieitouter inMemoryR
        <er(
      rendd'))
ation faileuthentic1 a Error('40lue(newkRejectedVamulation.mocckStartSi      mo)
lationpi.startSimupiService.amocked(a = vi.imulationt mockStartS      consling
n error handtioca Authenti3.2 -: mentsest Require // T
      () => {asyncctly', orreon errors cnticatihandle authed oult('sh})

    i})
    
      nt()ocumeInTheD).toBePatient/)uccess ext(/Retry Sen.getByTscre expect(       {
 => t waitFor(()  awai})

    (2)
      alledTimesBeenC).toHaveationStartSimulct(mock       expe> {
 ) =or((waitF     await  succeed
 etry andShould r  // 
    )
yButtonetr(rcknt.clifireEvetton
      k retry buicCl  // 

    ocument()InTheDtton).toBeryBuxpect(ret)
      ery Again/(/TTexten.getByon = screButtretry const     
 onetry buttould show r  // Sh)

    
      }()heDocument).toBeInTection/)ernet conneck your intByText(/chcreen.get expect(s()
       ocumentBeInTheD/)).toion failedctConnetByText(/screen.get(    expec
    (() => { waitFor    await error
  ow network Should sh

      //
      })RY-001')'VP-RETith(alledWHaveBeenCn).toatiokStartSimul expect(moc  
     () => {r(waitFoit  awa  )

         r>
yRoute  </Memor/>
      ChatPage onmulati<Si
          >]}1'P-RETRY-00simulation/V['/alEntries={r initioryRoute<Mem(
        nder
      re     })

 'ess Patientry SuccReteaks_for: ' sp    ,
   try worked!'ompt: 'ReialPrinit       
 ent',ati Success Pame: 'RetrytientN    pa
    ess-123',succy-Id: 'retrion  sess
      ValueOnce({kResolvedon.moctSimulatiStar    mock'))
  fetchled to or('Faiw Errce(neOnctedValuejeReockon.mulatiSimockStart)
      mSimulatione.api.startrvicocked(apiSe= vi.mon ulatiSimst mockStart
      contrying with rendl error ha Network: 3.1 -ementsst Requir // Te=> {
      async () onality',ctifun retry withk errors le networld handhou    it('s})

  ()
  cumentoBeInTheDo.tnotgain/)). ATry(/TextByreen.queryxpect(sc  ed case
    r invaliry button fow rett shod no // Shoul   

  ()
      })Document)).toBeInThee found/ bd not case coulhisByText(/Tn.getpect(scree      ex() => {
  it waitFor(  awar
     case erro invalidow/ Should sh)

      /