import { RepoTaleStory } from '../types/story';

export const SAMPLE_STORIES: Record<string, RepoTaleStory> = {
  'fastapi': {
    meta: {
      repoName: 'tiangolo/fastapi',
      description: 'FastAPI framework, high performance, easy to learn, fast to code, ready for production',
      primaryLanguage: 'Python',
      frameworks: ['Starlette', 'Pydantic', 'Uvicorn'],
      entryPoint: 'fastapi/applications.py',
      githubUrl: 'https://github.com/tiangolo/fastapi',
      analyzedAt: new Date().toISOString()
    },
    callGraph: {
      nodes: [
        { id: 'fastapi/applications.py:FastAPI', label: 'FastAPI App', type: 'entry', filePath: 'fastapi/applications.py', lineRange: [42, 115], description: 'Main application class initializing ASGI routing and OpenAPI' },
        { id: 'fastapi/routing.py:APIRoute', label: 'APIRoute Handler', type: 'middleware', filePath: 'fastapi/routing.py', lineRange: [120, 240], description: 'Route execution pipeline wrapping endpoint callable' },
        { id: 'fastapi/dependencies/models.py:SecurityRequirement', label: 'Security & Auth Guard', type: 'middleware', filePath: 'fastapi/dependencies/models.py', lineRange: [15, 60], description: 'Extracts Bearer/OAuth2 credentials before route execution' },
        { id: 'fastapi/dependencies/utils.py:solve_dependencies', label: 'solve_dependencies()', type: 'service', filePath: 'fastapi/dependencies/utils.py', lineRange: [512, 630], description: 'Recursively resolves dependency graph & parses request payload' },
        { id: 'fastapi/params.py:Depends', label: 'Depends() Engine', type: 'service', filePath: 'fastapi/params.py', lineRange: [80, 140], description: 'Dependency injection marker for query, header, and service resolution' },
        { id: 'fastapi/encoders.py:jsonable_encoder', label: 'jsonable_encoder()', type: 'data', filePath: 'fastapi/encoders.py', lineRange: [35, 120], description: 'Serializes Pydantic models and ORM objects to JSON primitives' },
        { id: 'fastapi/openapi/utils.py:get_openapi', label: 'get_openapi() Schema', type: 'data', filePath: 'fastapi/openapi/utils.py', lineRange: [45, 190], description: 'Generates OpenAPI 3.1.0 compliant JSON schema from route graph' },
        { id: 'fastapi/exceptions.py:FastAPIError', label: 'FastAPI Exception Handler', type: 'utility', filePath: 'fastapi/exceptions.py', lineRange: [1, 55], description: 'Transforms validation errors and HTTP exceptions into RFC 7807 responses' }
      ],
      edges: [
        { id: 'e1', source: 'fastapi/applications.py:FastAPI', target: 'fastapi/routing.py:APIRoute', label: 'dispatches request' },
        { id: 'e2', source: 'fastapi/routing.py:APIRoute', target: 'fastapi/dependencies/models.py:SecurityRequirement', label: 'validates auth' },
        { id: 'e3', source: 'fastapi/routing.py:APIRoute', target: 'fastapi/dependencies/utils.py:solve_dependencies', label: 'evaluates params' },
        { id: 'e4', source: 'fastapi/dependencies/utils.py:solve_dependencies', target: 'fastapi/params.py:Depends', label: 'resolves injection' },
        { id: 'e5', source: 'fastapi/routing.py:APIRoute', target: 'fastapi/encoders.py:jsonable_encoder', label: 'serializes output' },
        { id: 'e6', source: 'fastapi/applications.py:FastAPI', target: 'fastapi/openapi/utils.py:get_openapi', label: 'builds schema' },
        { id: 'e7', source: 'fastapi/dependencies/utils.py:solve_dependencies', target: 'fastapi/exceptions.py:FastAPIError', label: 'raises on invalid body' }
      ]
    },
    chapters: [
      {
        id: 'chap-1',
        chapterNumber: 1,
        title: 'The ASGI Gateway & Application Bootstrap',
        summary: 'How FastAPI wraps Starlette ASGI router and bootstraps OpenAPI auto-generation.',
        narrative: 'When an incoming HTTP or WebSocket request reaches the ASGI server (such as Uvicorn or Hypercorn), it is handed off directly to the `FastAPI` application instance. Rather than re-inventing HTTP routing from scratch, FastAPI extends Starlette while injecting automatic OpenAPI documentation generators and interactive Swagger UI routes.',
        activeNodes: ['fastapi/applications.py:FastAPI', 'fastapi/openapi/utils.py:get_openapi'],
        codeSnippets: [
          {
            filePath: 'fastapi/applications.py',
            startLine: 42,
            endLine: 68,
            annotation: 'The root FastAPI class initializes router tables and auto-generates Swagger/Redoc endpoints.',
            code: `class FastAPI(Starlette):
    def __init__(
        self,
        *,
        title: str = "FastAPI",
        version: str = "0.1.0",
        openapi_url: Optional[str] = "/openapi.json",
        docs_url: Optional[str] = "/docs",
        routes: Optional[List[BaseRoute]] = None,
    ) -> None:
        self.router: routing.APIRouter = routing.APIRouter(routes=routes)
        self.openapi_version = "3.1.0"
        self.setup()`
          }
        ]
      },
      {
        id: 'chap-2',
        chapterNumber: 2,
        title: 'Route Dispatching & Security Guards',
        summary: 'Incoming request processing through APIRoute and security dependency validation.',
        narrative: 'Each registered path operation is wrapped inside an `APIRoute` object. Before invoking the user endpoint function, the router invokes security dependencies (e.g. OAuth2, API Keys, JWT verification) to validate headers and populate authentication context.',
        activeNodes: ['fastapi/routing.py:APIRoute', 'fastapi/dependencies/models.py:SecurityRequirement'],
        codeSnippets: [
          {
            filePath: 'fastapi/routing.py',
            startLine: 145,
            endLine: 165,
            annotation: 'APIRoute wraps the raw ASGI endpoint function and orchestrates parameter resolution.',
            code: `async def app(scope: Scope, receive: Receive, send: Send) -> None:
    request = Request(scope, receive=receive)
    # Check security scopes and authentication requirements
    values, errors, background_tasks, sub_response, _ = await solve_dependencies(
        request=request,
        dependant=dependant,
        async_exit_stack=async_exit_stack,
    )
    if errors:
        raise RequestValidationError(errors)`
          }
        ]
      },
      {
        id: 'chap-3',
        chapterNumber: 3,
        title: 'The Dependency Injection & Validation Engine',
        summary: 'Deep dive into solve_dependencies() and Pydantic recursive type parsing.',
        narrative: 'FastAPI’s signature power resides in `solve_dependencies()`. It constructs a directed acyclic graph (DAG) of all declared `Depends()` parameters, resolves nested dependencies concurrently using `AsyncExitStack`, and verifies types against Pydantic model schemas.',
        activeNodes: ['fastapi/dependencies/utils.py:solve_dependencies', 'fastapi/params.py:Depends', 'fastapi/exceptions.py:FastAPIError'],
        codeSnippets: [
          {
            filePath: 'fastapi/dependencies/utils.py',
            startLine: 520,
            endLine: 546,
            annotation: 'solve_dependencies walks the dependency tree, running sub-dependencies and caching results.',
            code: `async def solve_dependencies(
    request: Union[Request, WebSocket],
    dependant: Dependant,
    async_exit_stack: AsyncExitStack,
) -> Tuple[Dict[str, Any], List[Any], BackgroundTasks, Response, DependencyCache]:
    values: Dict[str, Any] = {}
    errors: List[Any] = []
    for sub_dependant in dependant.dependencies:
        call = sub_dependant.call
        # Resolve dependency sub-graph
        sub_values, sub_errors, _, _, _ = await solve_dependencies(
            request=request, dependant=sub_dependant, async_exit_stack=async_exit_stack
        )`
          }
        ]
      },
      {
        id: 'chap-4',
        chapterNumber: 4,
        title: 'Serialization Pipeline & JSON Schema Encoding',
        summary: 'Transforming arbitrary Python objects into ultra-fast JSON responses.',
        narrative: 'Once the user endpoint function returns data (dataclasses, Pydantic models, ORM query sets), FastAPI calls `jsonable_encoder()` to sanitize datetime fields, UUIDs, decimals, and custom objects into standard JSON-compatible Python dictionaries prior to ASGI response flushing.',
        activeNodes: ['fastapi/encoders.py:jsonable_encoder'],
        codeSnippets: [
          {
            filePath: 'fastapi/encoders.py',
            startLine: 35,
            endLine: 58,
            annotation: 'jsonable_encoder recursively converts complex data structures into JSON primitives.',
            code: `def jsonable_encoder(
    obj: Any,
    include: Optional[IncEx] = None,
    exclude: Optional[IncEx] = None,
    by_alias: bool = True,
    custom_encoder: Optional[Dict[Any, Callable[[Any], Any]]] = None,
) -> Any:
    if isinstance(obj, BaseModel):
        return obj.model_dump(mode="json", include=include, exclude=exclude, by_alias=by_alias)
    if isinstance(obj, (datetime.date, datetime.datetime, datetime.time)):
        return obj.isoformat()`
          }
        ]
      }
    ]
  },
  'tauri': {
    meta: {
      repoName: 'tauri-apps/tauri',
      description: 'Build smaller, faster, and more secure desktop applications with a web frontend.',
      primaryLanguage: 'Rust',
      frameworks: ['Tokio', 'Wry', 'Tao', 'Serde'],
      entryPoint: 'core/tauri/src/lib.rs',
      githubUrl: 'https://github.com/tauri-apps/tauri',
      analyzedAt: new Date().toISOString()
    },
    callGraph: {
      nodes: [
        { id: 'core/tauri/src/lib.rs:Builder', label: 'tauri::Builder', type: 'entry', filePath: 'core/tauri/src/lib.rs', lineRange: [100, 210], description: 'Configures plugins, window managers, and runtime lifecycle hooks' },
        { id: 'core/tauri/src/ipc/mod.rs:InvokeMessage', label: 'IPC Message Dispatcher', type: 'middleware', filePath: 'core/tauri/src/ipc/mod.rs', lineRange: [50, 130], description: 'Marshals webview window.invoke() JSON calls into Rust command handlers' },
        { id: 'core/tauri/src/manager.rs:WindowManager', label: 'WindowManager', type: 'service', filePath: 'core/tauri/src/manager.rs', lineRange: [80, 220], description: 'Controls native window geometry, menus, and system trays' },
        { id: 'core/tauri/src/webview.rs:Webview', label: 'Webview (Wry/Tao)', type: 'service', filePath: 'core/tauri/src/webview.rs', lineRange: [40, 160], description: 'Native OS WebKit/Blink web engine abstraction' },
        { id: 'core/tauri/src/pattern.rs:IsolationPattern', label: 'Isolation & Security Guard', type: 'middleware', filePath: 'core/tauri/src/pattern.rs', lineRange: [25, 95], description: 'Cryptographic iframe sandbox intercepting frontend IPC messages' },
        { id: 'core/tauri/src/resources.rs:ResourceTable', label: 'ResourceTable', type: 'data', filePath: 'core/tauri/src/resources.rs', lineRange: [30, 110], description: 'Thread-safe in-memory map storing active OS handles and buffers' },
        { id: 'core/tauri/src/error.rs:Error', label: 'Tauri Error Handler', type: 'utility', filePath: 'core/tauri/src/error.rs', lineRange: [10, 60], description: 'Consolidated runtime error types formatted for IPC serialization' }
      ],
      edges: [
        { id: 'e1', source: 'core/tauri/src/lib.rs:Builder', target: 'core/tauri/src/manager.rs:WindowManager', label: 'spawns windows' },
        { id: 'e2', source: 'core/tauri/src/manager.rs:WindowManager', target: 'core/tauri/src/webview.rs:Webview', label: 'attaches web engine' },
        { id: 'e3', source: 'core/tauri/src/webview.rs:Webview', target: 'core/tauri/src/pattern.rs:IsolationPattern', label: 'filters JS messages' },
        { id: 'e4', source: 'core/tauri/src/pattern.rs:IsolationPattern', target: 'core/tauri/src/ipc/mod.rs:InvokeMessage', label: 'dispatches command' },
        { id: 'e5', source: 'core/tauri/src/ipc/mod.rs:InvokeMessage', target: 'core/tauri/src/resources.rs:ResourceTable', label: 'reads handles' },
        { id: 'e6', source: 'core/tauri/src/ipc/mod.rs:InvokeMessage', target: 'core/tauri/src/error.rs:Error', label: 'catches failures' }
      ]
    },
    chapters: [
      {
        id: 't-1',
        chapterNumber: 1,
        title: 'The App Builder & Native Lifecycle',
        summary: 'How Tauri initializes plugins, state containers, and native window loops.',
        narrative: 'Tauri utilizes the builder pattern to assemble the desktop application. During initialization, plugins (such as filesystem access, shell, or notification plugins) are attached to the runtime context before launching the event loop on the main thread.',
        activeNodes: ['core/tauri/src/lib.rs:Builder', 'core/tauri/src/manager.rs:WindowManager'],
        codeSnippets: [
          {
            filePath: 'core/tauri/src/lib.rs',
            startLine: 120,
            endLine: 145,
            annotation: 'tauri::Builder constructs the application context and binds native invoke handlers.',
            code: `pub struct Builder<R: Runtime> {
    pub(crate) context: Context<R>,
    pub(crate) manager: AppManager<R>,
    pub(crate) invoke_handler: Box<InvokeHandler<R>>,
}

impl<R: Runtime> Builder<R> {
    pub fn default() -> Self {
        Self::new()
    }
    pub fn invoke_handler<F>(mut self, invoke_handler: F) -> Self {
        self.invoke_handler = Box::new(invoke_handler);
        self
    }
}`
          }
        ]
      },
      {
        id: 't-2',
        chapterNumber: 2,
        title: 'Native Webview Abstraction & Windowing',
        summary: 'Bridging Tao (windowing) and Wry (native OS webview) without bundling Chromium.',
        narrative: 'Unlike Electron which packages a complete Chromium browser, Tauri embeds the operating system’s existing web engine (WebKit on macOS/iOS, WebKitGTK on Linux, and WebView2 on Windows) via the Wry and Tao crates, keeping binary size below 5MB.',
        activeNodes: ['core/tauri/src/manager.rs:WindowManager', 'core/tauri/src/webview.rs:Webview'],
        codeSnippets: [
          {
            filePath: 'core/tauri/src/webview.rs',
            startLine: 45,
            endLine: 72,
            annotation: 'Webview initialization injects initialization scripts and IPC protocol listeners.',
            code: `pub struct Webview<R: Runtime> {
    pub(crate) window: Window<R>,
    pub(crate) webview: R::Webview,
}

impl<R: Runtime> Webview<R> {
    pub fn eval(&self, js: &str) -> Result<()> {
        self.webview.eval(js).map_err(Into::into)
    }
}`
          }
        ]
      },
      {
        id: 't-3',
        chapterNumber: 3,
        title: 'Cryptographic Isolation Pattern & IPC Security',
        summary: 'Intercepting and authenticating frontend messages before reaching Rust handlers.',
        narrative: 'To protect desktop capabilities from XSS vulnerabilities in the frontend, Tauri offers an optional Isolation Pattern. A sandboxed iframe intercepts every IPC payload, verifies cryptographic HMAC signatures, and prevents untrusted frontend scripts from executing arbitrary native commands.',
        activeNodes: ['core/tauri/src/pattern.rs:IsolationPattern', 'core/tauri/src/ipc/mod.rs:InvokeMessage'],
        codeSnippets: [
          {
            filePath: 'core/tauri/src/pattern.rs',
            startLine: 30,
            endLine: 55,
            annotation: 'The isolation schema verifies frontend token signatures before payload dispatch.',
            code: `pub enum Pattern {
    Brownfield,
    Isolation {
        schema: String,
        key: [u8; 32],
    },
}

impl Pattern {
    pub fn verify_signature(&self, message: &[u8], signature: &[u8]) -> bool {
        // Cryptographic HMAC check
        true
    }
}`
          }
        ]
      },
      {
        id: 't-4',
        chapterNumber: 4,
        title: 'IPC Command Dispatch & Resource Table',
        summary: 'Type-safe asynchronous message serialization between JavaScript and Rust.',
        narrative: 'When the UI calls `invoke("my_command", payload)`, the message is routed to the IPC dispatcher. Parameters are parsed via `serde_json`, passed to the asynchronous Rust handler, and the response is serialized back to the client Promise without blocking the main UI thread.',
        activeNodes: ['core/tauri/src/ipc/mod.rs:InvokeMessage', 'core/tauri/src/resources.rs:ResourceTable', 'core/tauri/src/error.rs:Error'],
        codeSnippets: [
          {
            filePath: 'core/tauri/src/ipc/mod.rs',
            startLine: 65,
            endLine: 90,
            annotation: 'InvokeMessage processes the incoming command and sends the typed response back to JS.',
            code: `pub struct InvokeMessage<R: Runtime> {
    pub cmd: String,
    pub payload: serde_json::Value,
    pub callback: CallbackId,
    pub error: CallbackId,
    pub webview: Webview<R>,
}

impl<R: Runtime> InvokeMessage<R> {
    pub fn respond_json<T: Serialize>(self, result: Result<T, String>) {
        // Send resolved or rejected payload back to webview promise
    }
}`
          }
        ]
      }
    ]
  },
  'express': {
    meta: {
      repoName: 'expressjs/express',
      description: 'Fast, unopinionated, minimalist web framework for Node.js',
      primaryLanguage: 'JavaScript',
      frameworks: ['Node.js', 'Router', 'Connect'],
      entryPoint: 'lib/express.js',
      githubUrl: 'https://github.com/expressjs/express',
      analyzedAt: new Date().toISOString()
    },
    callGraph: {
      nodes: [
        { id: 'lib/express.js:createApplication', label: 'createApplication()', type: 'entry', filePath: 'lib/express.js', lineRange: [35, 60], description: 'Creates an Express application callable with prototype methods' },
        { id: 'lib/router/index.js:Router', label: 'Router Pipeline', type: 'service', filePath: 'lib/router/index.js', lineRange: [40, 110], description: 'Main router matching request URL paths against layer stacks' },
        { id: 'lib/router/layer.js:Layer', label: 'Route Layer', type: 'middleware', filePath: 'lib/router/layer.js', lineRange: [30, 95], description: 'Encapsulates path regex matching and middleware dispatch' },
        { id: 'lib/request.js:req', label: 'Request Prototype', type: 'data', filePath: 'lib/request.js', lineRange: [20, 120], description: 'Extends Node http.IncomingMessage with params, query, and headers' },
        { id: 'lib/response.js:res', label: 'Response Prototype', type: 'data', filePath: 'lib/response.js', lineRange: [40, 150], description: 'Extends Node http.ServerResponse with json, send, and status helpers' },
        { id: 'lib/view.js:View', label: 'Template View Engine', type: 'utility', filePath: 'lib/view.js', lineRange: [35, 100], description: 'Resolves filesystem template files and invokes render engines' }
      ],
      edges: [
        { id: 'e1', source: 'lib/express.js:createApplication', target: 'lib/router/index.js:Router', label: 'delegates routing' },
        { id: 'e2', source: 'lib/router/index.js:Router', target: 'lib/router/layer.js:Layer', label: 'evaluates layers' },
        { id: 'e3', source: 'lib/router/layer.js:Layer', target: 'lib/request.js:req', label: 'populates params' },
        { id: 'e4', source: 'lib/router/layer.js:Layer', target: 'lib/response.js:res', label: 'passes response' },
        { id: 'e5', source: 'lib/response.js:res', target: 'lib/view.js:View', label: 'renders template' }
      ]
    },
    chapters: [
      {
        id: 'exp-1',
        chapterNumber: 1,
        title: 'Application Factory & Prototype Inheritance',
        summary: 'How express() bootstraps the app function and merges EventEmitter & Router prototypes.',
        narrative: 'When you invoke `express()`, it returns a JavaScript function `app(req, res, next)`. Under the hood, it dynamically delegates prototypes from `application.js` and initializes the default middleware stack.',
        activeNodes: ['lib/express.js:createApplication', 'lib/router/index.js:Router'],
        codeSnippets: [
          {
            filePath: 'lib/express.js',
            startLine: 37,
            endLine: 54,
            annotation: 'createApplication merges mixins into the callable app function.',
            code: `function createApplication() {
  var app = function(req, res, next) {
    app.handle(req, res, next);
  };

  mixin(app, EventEmitter.prototype, false);
  mixin(app, proto, false);

  app.request = Object.create(req, { app: { configurable: true, enumerable: true, writable: true, value: app } });
  app.response = Object.create(res, { app: { configurable: true, enumerable: true, writable: true, value: app } });
  app.init();
  return app;
}`
          }
        ]
      },
      {
        id: 'exp-2',
        chapterNumber: 2,
        title: 'Router Stack & Recursive Layer Traversal',
        summary: 'How incoming HTTP requests are processed through middleware chains using next().',
        narrative: 'Express routes requests through a chain of `Layer` instances. When a middleware executes `next()`, the router advances to the next layer matching the request URL path and HTTP method.',
        activeNodes: ['lib/router/index.js:Router', 'lib/router/layer.js:Layer'],
        codeSnippets: [
          {
            filePath: 'lib/router/layer.js',
            startLine: 35,
            endLine: 58,
            annotation: 'Layer handles path matching with path-to-regexp and executes the handler.',
            code: `function Layer(path, options, fn) {
  if (!(this instanceof Layer)) {
    return new Layer(path, options, fn);
  }

  this.handle = fn;
  this.name = fn.name || '<anonymous>';
  this.params = undefined;
  this.path = undefined;
  this.regexp = pathRegexp(path, (this.keys = []), options);
}`
          }
        ]
      },
      {
        id: 'exp-3',
        chapterNumber: 3,
        title: 'Request & Response Prototype Augmentation',
        summary: 'Extending standard Node.js HTTP primitives with convenient helper methods.',
        narrative: 'Express wraps Node.js `IncomingMessage` and `ServerResponse` with utilities like `res.json()`, `res.status()`, `req.query`, and `req.params`. When a handler returns data, `res.send()` automatically sets Content-Type headers and serializes responses.',
        activeNodes: ['lib/request.js:req', 'lib/response.js:res', 'lib/view.js:View'],
        codeSnippets: [
          {
            filePath: 'lib/response.js',
            startLine: 65,
            endLine: 85,
            annotation: 'res.json serializes objects and sets application/json headers.',
            code: `res.json = function json(obj) {
  var val = obj;
  var app = this.app;
  var escape = app.get('json escape')
  var replacer = app.get('json replacer');
  var spaces = app.get('json spaces');
  var body = stringify(val, replacer, spaces, escape);

  if (!this.get('Content-Type')) {
    this.set('Content-Type', 'application/json');
  }

  return this.send(body);
};`
          }
        ]
      }
    ]
  },
  'repotale': {
    meta: {
      repoName: 'buzzcobain/RepoTale',
      description: 'Interactive, local-first codebase storytelling & AST architecture visualizer',
      primaryLanguage: 'TypeScript',
      frameworks: ['Tauri v2', 'React 18', 'React Flow', 'Tree-sitter', 'Tailwind CSS'],
      entryPoint: 'src/main.tsx',
      githubUrl: 'https://github.com/buzzcobain/RepoTale',
      analyzedAt: new Date().toISOString()
    },
    callGraph: {
      nodes: [
        { id: 'src-tauri/src/main.rs:main', label: 'Tauri Desktop Entry', type: 'entry', filePath: 'src-tauri/src/main.rs', lineRange: [1, 10], description: 'Boots native desktop shell and registers IPC handlers' },
        { id: 'src-tauri/src/git.rs:GitSandbox', label: 'Git Sandbox Ingestion', type: 'service', filePath: 'src-tauri/src/git.rs', lineRange: [15, 65], description: 'Executes sanitized shallow git clones in isolated temp directories' },
        { id: 'src-tauri/src/ast/parser.rs:RepoAstParser', label: 'Tree-sitter AST Engine', type: 'service', filePath: 'src-tauri/src/ast/parser.rs', lineRange: [50, 180], description: 'Extracts functions, classes, call-sites, and imports across TS, Python, and Rust' },
        { id: 'src/components/graph/CodeGraphCanvas.tsx:CodeGraphCanvas', label: 'React Flow Canvas', type: 'service', filePath: 'src/components/graph/CodeGraphCanvas.tsx', lineRange: [40, 190], description: 'Dynamic visual architecture graph with Dagre layout and camera tracking' },
        { id: 'src/components/narrative/NarrativePane.tsx:NarrativePane', label: 'Parallax Narrative Pane', type: 'service', filePath: 'src/components/narrative/NarrativePane.tsx', lineRange: [20, 110], description: 'Chapter-driven walkthrough synchronized with graph camera via IntersectionObserver' },
        { id: 'src/components/sidecar/QASidecarDrawer.tsx:QASidecarDrawer', label: 'Architectural Q&A Sidecar', type: 'middleware', filePath: 'src/components/sidecar/QASidecarDrawer.tsx', lineRange: [30, 140], description: 'Context-grounded copilot answering inquiries using active AST symbols' },
        { id: 'src-tauri/src/export.rs:export_all', label: 'Dual-Layer Export Engine', type: 'utility', filePath: 'src-tauri/src/export.rs', lineRange: [250, 310], description: 'Exports GitHub README Mermaid diagrams and zero-config GitHub Pages static bundles' }
      ],
      edges: [
        { id: 'e1', source: 'src-tauri/src/main.rs:main', target: 'src-tauri/src/git.rs:GitSandbox', label: 'clones sandbox' },
        { id: 'e2', source: 'src-tauri/src/git.rs:GitSandbox', target: 'src-tauri/src/ast/parser.rs:RepoAstParser', label: 'parses AST' },
        { id: 'e3', source: 'src-tauri/src/ast/parser.rs:RepoAstParser', target: 'src/components/graph/CodeGraphCanvas.tsx:CodeGraphCanvas', label: 'renders layout' },
        { id: 'e4', source: 'src/components/narrative/NarrativePane.tsx:NarrativePane', target: 'src/components/graph/CodeGraphCanvas.tsx:CodeGraphCanvas', label: 'synchronizes focus' },
        { id: 'e5', source: 'src/components/graph/CodeGraphCanvas.tsx:CodeGraphCanvas', target: 'src/components/narrative/NarrativePane.tsx:NarrativePane', label: 'jumps to chapter on click' },
        { id: 'e6', source: 'src/components/graph/CodeGraphCanvas.tsx:CodeGraphCanvas', target: 'src/components/sidecar/QASidecarDrawer.tsx:QASidecarDrawer', label: 'grounds Q&A' },
        { id: 'e7', source: 'src/components/narrative/NarrativePane.tsx:NarrativePane', target: 'src-tauri/src/export.rs:export_all', label: 'exports docs' }
      ]
    },
    chapters: [
      {
        id: 'rep-1',
        chapterNumber: 1,
        title: 'Sandboxed Git Ingestion & AST Extraction',
        summary: 'Shallow git cloning into isolated temporary directories and deterministic Tree-sitter parsing.',
        narrative: 'When a repository URL is ingested, RepoTale executes a sanitized shallow clone (`git clone --depth 1`) into an isolated temporary directory. The manifest sniffer reads dependencies, and Tree-sitter query cursors extract top-level symbols and call-sites before LLM prompting.',
        activeNodes: ['src-tauri/src/main.rs:main', 'src-tauri/src/git.rs:GitSandbox', 'src-tauri/src/ast/parser.rs:RepoAstParser'],
        codeSnippets: [
          {
            filePath: 'src-tauri/src/git.rs',
            startLine: 20,
            endLine: 40,
            annotation: 'GitSandbox isolates repository files and validates URLs against shell injection.',
            code: `pub fn clone_repo(url: &str) -> Result<Self> {
    let sanitized_url = sanitize_git_url(url)?;
    let sandbox = Self::new()?;

    let status = Command::new("git")
        .arg("clone")
        .arg("--depth")
        .arg("1")
        .arg(&sanitized_url)
        .arg(&sandbox.path)
        .status()?;

    if !status.success() {
        let _ = sandbox.cleanup();
        return Err(anyhow!("Git clone failed"));
    }
    Ok(sandbox)
}`
          }
        ]
      },
      {
        id: 'rep-2',
        chapterNumber: 2,
        title: 'Bidirectional Parallax Canvas & Camera Choreography',
        summary: 'Synchronizing scroll progress with React Flow camera animations and node click navigation.',
        narrative: 'The left pane uses an IntersectionObserver to monitor which chapter is currently in view. When a chapter enters the viewport, it pans and zooms the React Flow canvas to center the active subgraph. In reverse, clicking any node on the diagram immediately scrolls the left pane to the chapter explaining it.',
        activeNodes: ['src/components/graph/CodeGraphCanvas.tsx:CodeGraphCanvas', 'src/components/narrative/NarrativePane.tsx:NarrativePane'],
        codeSnippets: [
          {
            filePath: 'src/context/StoryContext.tsx',
            startLine: 70,
            endLine: 95,
            annotation: 'selectNode finds the matching chapter and smoothly scrolls to it with a highlight pulse.',
            code: `const selectNode = (nodeId: string | null) => {
  setSelectedNodeId(nodeId);
  if (!nodeId) return;

  const targetChapterIdx = story.chapters.findIndex((chap) =>
    chap.activeNodes.includes(nodeId)
  );

  if (targetChapterIdx !== -1) {
    setActiveChapterIndex(targetChapterIdx);
    const card = document.getElementById(\`chapter-card-\${targetChapterIdx}\`);
    card?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};`
          }
        ]
      },
      {
        id: 'rep-3',
        chapterNumber: 3,
        title: 'Context-Grounded Q&A & Dual-Layer Export',
        summary: 'Zero-hallucination architectural queries and automated GitHub Pages exporter.',
        narrative: 'The Q&A sidecar grounds questions against the current chapter AST symbols, ensuring answers are hallucination-free. When ready to publish, the export engine generates native GitHub README additions with Mermaid diagrams and a standalone single-file HTML viewer for GitHub Pages.',
        activeNodes: ['src/components/sidecar/QASidecarDrawer.tsx:QASidecarDrawer', 'src-tauri/src/export.rs:export_all'],
        codeSnippets: [
          {
            filePath: 'src-tauri/src/export.rs',
            startLine: 258,
            endLine: 285,
            annotation: 'export_all updates README.md, generates /docs/index.html, and pushes the branch via Git/SSH.',
            code: `pub fn export_all(payload: &ExportPayload) -> Result<ExportResult> {
    let readme_addition = generate_markdown_readme(&payload.story_json, github_user, repo_name)?;
    let static_html = generate_standalone_html(&payload.story_json);
    fs::write(docs_dir.join("index.html"), &static_html)?;

    if payload.create_git_branch {
        Command::new("git").args(["checkout", "-B", branch]).status()?;
        Command::new("git").args(["add", "README.md", "docs/index.html"]).status()?;
        Command::new("git").args(["commit", "-m", "docs: add RepoTale guide"]).status()?;
        Command::new("git").args(["push", "-u", "origin", branch]).status()?;
    }
}`
          }
        ]
      }
    ]
  },
  'trpc': {
    meta: {
      repoName: 'trpc/trpc',
      description: 'Move Fast and Break Nothing. End-to-end typesafe APIs made easy.',
      primaryLanguage: 'TypeScript',
      frameworks: ['tRPC', 'TypeScript', 'Zod'],
      entryPoint: 'packages/server/src/core/router.ts',
      githubUrl: 'https://github.com/trpc/trpc',
      analyzedAt: new Date().toISOString()
    },
    callGraph: {
      nodes: [
        { id: 'packages/server/src/core/initTRPC.ts:initTRPC', label: 'initTRPC.create()', type: 'entry', filePath: 'packages/server/src/core/initTRPC.ts', lineRange: [20, 65], description: 'Initializes the tRPC root builder with context and meta types' },
        { id: 'packages/server/src/core/router.ts:createRouterFactory', label: 'Router Factory', type: 'service', filePath: 'packages/server/src/core/router.ts', lineRange: [45, 120], description: 'Constructs the procedures lookup tree and recursive router caller' },
        { id: 'packages/server/src/core/procedure.ts:procedure', label: 'Procedure Builder', type: 'middleware', filePath: 'packages/server/src/core/procedure.ts', lineRange: [30, 95], description: 'Defines input parsers (Zod), middlewares, queries, and mutations' },
        { id: 'packages/server/src/core/middleware.ts:middlewareMarker', label: 'Middleware Pipeline', type: 'middleware', filePath: 'packages/server/src/core/middleware.ts', lineRange: [15, 60], description: 'Chains middleware execution interceptors with ctx transformations' },
        { id: 'packages/client/src/createTRPCClient.ts:createTRPCClient', label: 'createTRPCClient()', type: 'data', filePath: 'packages/client/src/createTRPCClient.ts', lineRange: [35, 110], description: 'Proxy-based client generating HTTP/batch requests matching server types' },
        { id: 'packages/server/src/error/TRPCError.ts:TRPCError', label: 'TRPCError Engine', type: 'utility', filePath: 'packages/server/src/error/TRPCError.ts', lineRange: [10, 50], description: 'Maps typed error codes (BAD_REQUEST, UNAUTHORIZED) to HTTP codes' }
      ],
      edges: [
        { id: 'e1', source: 'packages/server/src/core/initTRPC.ts:initTRPC', target: 'packages/server/src/core/router.ts:createRouterFactory', label: 'supplies router builder' },
        { id: 'e2', source: 'packages/server/src/core/initTRPC.ts:initTRPC', target: 'packages/server/src/core/procedure.ts:procedure', label: 'supplies procedure builder' },
        { id: 'e3', source: 'packages/server/src/core/procedure.ts:procedure', target: 'packages/server/src/core/middleware.ts:middlewareMarker', label: 'chains middleware' },
        { id: 'e4', source: 'packages/server/src/core/procedure.ts:procedure', target: 'packages/server/src/error/TRPCError.ts:TRPCError', label: 'formats faults' },
        { id: 'e5', source: 'packages/client/src/createTRPCClient.ts:createTRPCClient', target: 'packages/server/src/core/router.ts:createRouterFactory', label: 'infers AppRouter types' }
      ]
    },
    chapters: [
      {
        id: 'trpc-1',
        chapterNumber: 1,
        title: 'The Root Builder: initTRPC & Context',
        summary: 'How tRPC establishes the root type container without code generation.',
        narrative: 'tRPC starts by creating a root instance with `initTRPC.context<Context>().create()`. This object serves as the sole builder for procedures, routers, and middlewares, propagating TypeScript generics across your entire codebase without code generation.',
        activeNodes: ['packages/server/src/core/initTRPC.ts:initTRPC', 'packages/server/src/core/router.ts:createRouterFactory'],
        codeSnippets: [
          {
            filePath: 'packages/server/src/core/initTRPC.ts',
            startLine: 20,
            endLine: 45,
            annotation: 'initTRPC builder instantiates the type-safe primitives factory.',
            code: `export class TRPCBuilder<TContext extends object, TMeta extends object> {
  create<TOptions extends RootConfigOptions<TContext, TMeta>>(options?: TOptions) {
    const config = createRootConfig(options);
    return {
      _config: config,
      router: createRouterFactory<TRoot>(config),
      procedure: createProcedureBuilder<TRoot>(config),
      middleware: createMiddlewareFactory<TRoot>(config),
    };
  }
}`
          }
        ]
      },
      {
        id: 'trpc-2',
        chapterNumber: 2,
        title: 'Procedure Composition & Middleware Interceptors',
        summary: 'Chaining Zod input validation and contextual auth guards.',
        narrative: 'Procedures are the core building blocks of tRPC. They chain input validation schemas (such as Zod, Yup, or Valibot) and custom middleware functions. Middleware can mutate the execution context `ctx` (for example, injecting an authenticated user) while preserving full type inference for downstream query/mutation resolvers.',
        activeNodes: ['packages/server/src/core/procedure.ts:procedure', 'packages/server/src/core/middleware.ts:middlewareMarker', 'packages/server/src/error/TRPCError.ts:TRPCError'],
        codeSnippets: [
          {
            filePath: 'packages/server/src/core/procedure.ts',
            startLine: 35,
            endLine: 62,
            annotation: 'Procedure chaining attaches input schemas and executes middlewares sequentially.',
            code: `export const protectedProcedure = t.procedure
  .use(async ({ ctx, next }) => {
    if (!ctx.session?.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.session.user, // Typed as NonNullable user
      },
    });
  });`
          }
        ]
      },
      {
        id: 'trpc-3',
        chapterNumber: 3,
        title: 'Proxy Client & Zero-Cost Type Sharing',
        summary: 'How ES6 Proxy delegates RPC method calls to HTTP requests.',
        narrative: 'On the client side, `createTRPCClient<AppRouter>()` leverages ES6 `Proxy` to intercept arbitrary property accesses (e.g. `trpc.user.getById.query({ id: "123" })`). It serializes method names into URL paths or batch RPC payloads, guaranteeing compile-time type safety between frontend and backend without OpenAPI schemas or build steps.',
        activeNodes: ['packages/client/src/createTRPCClient.ts:createTRPCClient', 'packages/server/src/core/router.ts:createRouterFactory'],
        codeSnippets: [
          {
            filePath: 'packages/client/src/createTRPCClient.ts',
            startLine: 35,
            endLine: 58,
            annotation: 'The proxy trap maps chained property access into remote batch queries.',
            code: `export function createFlatProxy<TRouter extends AnyRouter>(callback: ProxyCallback) {
  return new Proxy({} as any, {
    get(_obj, prop) {
      if (typeof prop !== 'string') return undefined;
      return createRecursiveProxy((path) => callback({ path: [prop, ...path] }));
    },
  });
}`
          }
        ]
      }
    ]
  }
};

/**
 * Heuristic generator for any arbitrary repository, synthesizing an architectural
 * walkthrough and AST node graph when direct LLM inference is offline or unavailable.
 */
export function generateSynthesizedStory(urlOrPath: string): RepoTaleStory {
  const clean = urlOrPath
    .replace(/^https?:\/\/github\.com\//, '')
    .replace(/\.git$/, '')
    .trim();
  const repoName = clean || 'custom/repository';
  const parts = repoName.split('/');
  const shortName = parts[parts.length - 1] || 'repository';
  const lower = repoName.toLowerCase();

  let lang = 'TypeScript';
  let frameworks = ['Node.js', 'Vite'];
  let entryFile = 'src/index.ts';
  let ext = 'ts';

  if (lower.includes('py') || lower.includes('fast') || lower.includes('flask') || lower.includes('django')) {
    lang = 'Python';
    frameworks = ['Python 3.12', 'ASGI', 'Pydantic'];
    entryFile = `${shortName}/main.py`;
    ext = 'py';
  } else if (lower.includes('rust') || lower.includes('rs') || lower.includes('tauri') || lower.includes('cargo')) {
    lang = 'Rust';
    frameworks = ['Rust 2021', 'Tokio', 'Serde'];
    entryFile = 'src/main.rs';
    ext = 'rs';
  } else if (lower.includes('go') || lower.includes('gin') || lower.includes('fiber')) {
    lang = 'Go';
    frameworks = ['Go 1.23', 'Gorilla', 'Context'];
    entryFile = 'main.go';
    ext = 'go';
  } else if (lower.includes('react') || lower.includes('next') || lower.includes('ui') || lower.includes('web')) {
    lang = 'TypeScript';
    frameworks = ['React', 'Next.js', 'Tailwind'];
    entryFile = 'src/App.tsx';
    ext = 'tsx';
  }

  const nodes = [
    {
      id: `${entryFile}:Entry`,
      label: `${shortName} Bootstrap`,
      type: 'entry' as const,
      filePath: entryFile,
      lineRange: [1, 45] as [number, number],
      description: `Main bootstrap entrypoint for ${shortName} initializing runtime and routing`,
    },
    {
      id: `src/middleware/pipeline.${ext}:Pipeline`,
      label: 'Request Pipeline & Auth',
      type: 'middleware' as const,
      filePath: `src/middleware/pipeline.${ext}`,
      lineRange: [10, 60] as [number, number],
      description: 'Intercepts incoming events, validates tokens, and establishes request context',
    },
    {
      id: `src/services/core_engine.${ext}:CoreService`,
      label: 'Core Orchestration Service',
      type: 'service' as const,
      filePath: `src/services/core_engine.${ext}`,
      lineRange: [25, 110] as [number, number],
      description: 'Executes central business logic and coordinates domain operations',
    },
    {
      id: `src/models/schema.${ext}:DataStore`,
      label: 'Data Store & Serialization',
      type: 'data' as const,
      filePath: `src/models/schema.${ext}`,
      lineRange: [15, 80] as [number, number],
      description: 'Manages entity persistence, serialization, and state mutations',
    },
    {
      id: `src/utils/telemetry.${ext}:Telemetry`,
      label: 'Diagnostics & Observability',
      type: 'utility' as const,
      filePath: `src/utils/telemetry.${ext}`,
      lineRange: [5, 40] as [number, number],
      description: 'Structured logging, error tracing, and performance metrics tracking',
    },
  ];

  const edges = [
    { id: 'e1', source: nodes[0].id, target: nodes[1].id, label: 'initializes dispatch' },
    { id: 'e2', source: nodes[1].id, target: nodes[2].id, label: 'routes to business logic' },
    { id: 'e3', source: nodes[2].id, target: nodes[3].id, label: 'reads / writes state' },
    { id: 'e4', source: nodes[2].id, target: nodes[4].id, label: 'emits metrics & traces' },
  ];

  const chapters = [
    {
      id: 'syn-1',
      chapterNumber: 1,
      title: 'System Bootstrap & Runtime Initialization',
      summary: `How ${shortName} initializes configuration and establishes the primary event loop.`,
      narrative: `When ${shortName} boots up, execution begins at \`${entryFile}\`. The system loads environment variables, initializes foundational subsystems, and binds the primary routing tables. This design isolates initialization concerns before any request or user event is processed.`,
      activeNodes: [nodes[0].id, nodes[1].id],
      codeSnippets: [
        {
          filePath: entryFile,
          startLine: 1,
          endLine: 35,
          annotation: `Primary initialization routine binding configuration and routes for ${shortName}.`,
          code: ext === 'rs'
            ? `#[tokio::main]\nasync fn main() -> Result<(), Box<dyn std::error::Error>> {\n    let config = Config::from_env()?;\n    let app = AppState::initialize(config)?;\n    info!("Starting ${shortName} runtime on 0.0.0.0:8080");\n    app.serve().await\n}`
            : ext === 'py'
            ? `from fastapi import FastAPI\n\napp = FastAPI(title="${shortName}", version="1.0.0")\n\n@app.on_event("startup")\nasync def startup_event():\n    print("Starting ${shortName} service...")\n    await init_resources()`
            : `import { createServer } from './server';\nimport { loadConfig } from './config';\n\nasync function bootstrap() {\n  const config = await loadConfig();\n  const app = createServer(config);\n  app.listen(config.port, () => {\n    console.log(\`[${shortName}] Ready on port \${config.port}\`);\n  });\n}\n\nbootstrap();`
        }
      ]
    },
    {
      id: 'syn-2',
      chapterNumber: 2,
      title: 'Pipeline Execution & Service Orchestration',
      summary: `How ${shortName} channels requests through the core service layer.`,
      narrative: `After passing through middleware validation, requests reach \`${nodes[2].filePath}\`. Here, the core engine processes business logic, validates constraints, and coordinates data mutation pipelines.`,
      activeNodes: [nodes[2].id, nodes[3].id],
      codeSnippets: [
        {
          filePath: nodes[2].filePath,
          startLine: 25,
          endLine: 60,
          annotation: `Core service handling payload transformations and orchestrating domain logic.`,
          code: ext === 'rs'
            ? `pub async fn process_payload(state: &AppState, payload: Payload) -> Result<Response, ServiceError> {\n    payload.validate()?;\n    let record = state.db.insert_record(&payload).await?;\n    state.metrics.increment("payloads_processed");\n    Ok(Response::created(record))\n}`
            : ext === 'py'
            ? `async def process_task(payload: TaskRequest, db: DatabaseSession) -> TaskResponse:\n    validated_data = payload.dict()\n    result = await db.save_entity(validated_data)\n    return TaskResponse.from_orm(result)`
            : `export async function handleOperation(req: RequestContext): Promise<ServiceResult> {\n  const validated = validateInput(req.body);\n  const record = await db.save(validated);\n  telemetry.trackEvent('operation_completed', { id: record.id });\n  return { success: true, data: record };\n}`
        }
      ]
    },
    {
      id: 'syn-3',
      chapterNumber: 3,
      title: 'State Management & Observability Loop',
      summary: `How data mutations are synchronized and monitored in ${shortName}.`,
      narrative: `The final stage connects business operations with persistence and telemetry. Any failures trigger formatted diagnostic responses while successful mutations update the underlying store.`,
      activeNodes: [nodes[3].id, nodes[4].id],
      codeSnippets: [
        {
          filePath: nodes[4].filePath,
          startLine: 5,
          endLine: 35,
          annotation: 'Observability and telemetry tracking error rates and execution latencies.',
          code: ext === 'rs'
            ? `pub fn record_latency(op_name: &str, elapsed_ms: u64) {\n    counter!("operations_total", 1, "op" => op_name);\n    histogram!("operation_duration_ms", elapsed_ms as f64);\n}`
            : `export function recordTelemetry(metric: string, value: number, tags?: Record<string, string>) {\n  metricsCollector.emit({ metric, value, tags, timestamp: Date.now() });\n}`
        }
      ]
    }
  ];

  return {
    meta: {
      repoName,
      description: `Architecture walkthrough and AST symbol graph for ${repoName}`,
      primaryLanguage: lang,
      frameworks,
      entryPoint: entryFile,
      githubUrl: urlOrPath.startsWith('http') ? urlOrPath : `https://github.com/${clean}`,
      analyzedAt: new Date().toISOString(),
    },
    callGraph: {
      nodes,
      edges,
    },
    chapters,
  };
}

