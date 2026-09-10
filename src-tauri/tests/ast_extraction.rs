use std::path::PathBuf;

use repotale_lib::ast::{AstSymbol, RepoAstParser};

fn fixture_dir(name: &str) -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("tests")
        .join("fixtures")
        .join(name)
}

fn parse_fixture(name: &str) -> Vec<AstSymbol> {
    let dir = fixture_dir(name);
    assert!(dir.exists(), "missing fixture repository: {}", dir.display());

    let mut parser = RepoAstParser::new();
    parser.parse_repository(&dir).file_symbols
}

fn find<'a>(symbols: &'a [AstSymbol], name: &str) -> &'a AstSymbol {
    symbols
        .iter()
        .find(|s| s.name == name)
        .unwrap_or_else(|| panic!("symbol `{}` was not extracted", name))
}

#[test]
fn go_fixture_extracts_functions_structs_and_interfaces() {
    let symbols = parse_fixture("go-sample");

    assert_eq!(find(&symbols, "NewServer").kind, "function");
    assert_eq!(find(&symbols, "Server").kind, "struct");
    assert_eq!(find(&symbols, "Handler").kind, "interface");
    assert_eq!(find(&symbols, "ListUsers").kind, "method");
    assert_eq!(find(&symbols, "UserRepository").kind, "interface");
}

#[test]
fn go_fixture_marks_main_and_goroutine_entrypoints() {
    let symbols = parse_fixture("go-sample");

    assert_eq!(find(&symbols, "main").node_type, "entry");
    assert_eq!(find(&symbols, "startBackgroundWorker").node_type, "entry");
}

#[test]
fn go_fixture_collects_import_paths() {
    let symbols = parse_fixture("go-sample");
    let main_fn = find(&symbols, "main");

    assert!(main_fn.imports.iter().any(|i| i == "net/http"));
    assert!(main_fn
        .imports
        .iter()
        .any(|i| i.ends_with("internal/service")));
}

#[test]
fn java_fixture_extracts_classes_interfaces_and_records() {
    let symbols = parse_fixture("java-sample");

    assert_eq!(find(&symbols, "UserController").kind, "class");
    assert_eq!(find(&symbols, "UserService").kind, "class");
    assert_eq!(find(&symbols, "UserRepository").kind, "interface");
    assert_eq!(find(&symbols, "User").kind, "record");
    assert_eq!(find(&symbols, "displayName").kind, "method");
}

#[test]
fn java_fixture_classifies_spring_boot_annotations() {
    let symbols = parse_fixture("java-sample");

    assert_eq!(find(&symbols, "DemoApplication").node_type, "entry");
    assert_eq!(find(&symbols, "UserController").node_type, "entry");
    assert_eq!(find(&symbols, "UserService").node_type, "service");
    assert_eq!(find(&symbols, "UserRepository").node_type, "data");
}

#[test]
fn java_fixture_propagates_class_annotations_to_methods() {
    let symbols = parse_fixture("java-sample");
    let controller_methods: Vec<&AstSymbol> = symbols
        .iter()
        .filter(|s| s.file_path.ends_with("UserController.java") && s.kind == "method")
        .collect();

    assert!(!controller_methods.is_empty());
    assert!(controller_methods.iter().all(|s| s.node_type == "entry"));
}

#[test]
fn java_fixture_collects_import_paths() {
    let symbols = parse_fixture("java-sample");
    let controller = find(&symbols, "UserController");

    assert!(controller
        .imports
        .iter()
        .any(|i| i == "org.springframework.web.bind.annotation.RestController"));
}

#[test]
fn csharp_fixture_extracts_controllers_records_and_interfaces() {
    let symbols = parse_fixture("csharp-sample");

    assert_eq!(find(&symbols, "WeatherForecastController").kind, "class");
    assert_eq!(find(&symbols, "WeatherForecast").kind, "record");
    assert_eq!(find(&symbols, "IWeatherService").kind, "interface");
    assert_eq!(find(&symbols, "WeatherService").kind, "class");
}

#[test]
fn csharp_fixture_classifies_aspnet_controllers_and_services() {
    let symbols = parse_fixture("csharp-sample");

    assert_eq!(find(&symbols, "WeatherForecastController").node_type, "entry");
    assert_eq!(find(&symbols, "WeatherService").node_type, "service");
    assert_eq!(find(&symbols, "IWeatherService").node_type, "service");
}

#[test]
fn csharp_fixture_collects_using_directives() {
    let symbols = parse_fixture("csharp-sample");
    let controller = find(&symbols, "WeatherForecastController");

    assert!(controller
        .imports
        .iter()
        .any(|i| i == "Microsoft.AspNetCore.Mvc"));
}

#[test]
fn every_fixture_produces_a_connected_scaffold() {
    for fixture in ["go-sample", "java-sample", "csharp-sample"] {
        let dir = fixture_dir(fixture);
        let mut parser = RepoAstParser::new();
        let scaffold = parser.parse_repository(&dir);

        assert!(
            !scaffold.nodes.is_empty(),
            "{} produced no graph nodes",
            fixture
        );
        assert_eq!(scaffold.nodes.len(), scaffold.file_symbols.len());

        for symbol in &scaffold.file_symbols {
            assert!(symbol.start_line > 0, "{} has an invalid start line", symbol.name);
            assert!(symbol.end_line >= symbol.start_line);
            assert!(!symbol.snippet.is_empty(), "{} has an empty snippet", symbol.name);
        }
    }
}
