using Microsoft.AspNetCore.Mvc;
using Sample.Services;

namespace Sample.Controllers;

[ApiController]
[Route("api/[controller]")]
public class WeatherForecastController : ControllerBase
{
    private readonly IWeatherService _weatherService;

    public WeatherForecastController(IWeatherService weatherService)
    {
        _weatherService = weatherService;
    }

    [HttpGet]
    public IEnumerable<WeatherForecast> GetForecast()
    {
        return _weatherService.GetForecast(5);
    }

    [HttpGet("{city}")]
    public WeatherForecast GetForecastForCity(string city)
    {
        return _weatherService.GetForecastForCity(city);
    }
}
