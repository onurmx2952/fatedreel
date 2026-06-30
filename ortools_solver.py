from program.ortools_solver import solve_program

try:
    from program.ortools_solver import app
except ImportError:
    app = None

__all__ = ["app", "solve_program"]
