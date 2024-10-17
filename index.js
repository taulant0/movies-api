import express from 'express';
import bodyParser from 'body-parser';
import axios from 'axios';

const app = express();
const port = 3000;
const apiKey = '4ada1f77175536be5414de636e1113de';
const baseUrl = 'https://api.themoviedb.org/3';

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");

// Fetch random movies for the initial load
async function fetchRandomMovies() {
  try {
    const response = await axios.get(`${baseUrl}/movie/popular`, {
      params: {
        api_key: apiKey,
        page: 1,
      }
    });
    return {
      results: response.data.results.slice(0, 18),  // Limit to 18 movies
      totalResults: response.data.total_results
    };
  } catch (error) {
    console.error("Failed to fetch random movies:", error.message);
    return {
      results: [],
      totalResults: 0
    };
  }
}

app.get("/", async (req, res) => {
  const { results, totalResults } = await fetchRandomMovies();
  const totalPages = Math.ceil(totalResults / 18);
  res.render("index", { data: results, error: null, query: {}, page: 1, totalPages });
});

app.post("/", async (req, res) => {
  const { name, year, genre, rating, page = 1 } = req.body;
  const query = { name, year, genre, rating };

  try {
    let response;

    if (name) {
      response = await axios.get(`${baseUrl}/search/movie`, {
        params: {
          api_key: apiKey,
          query: name,
          year: year,
          page: page,
        }
      });
    } else {
      const genreResponse = await axios.get(`${baseUrl}/genre/movie/list?api_key=${apiKey}`);
      const genres = genreResponse.data.genres;
      const genreId = genres.find(g => g.name.toLowerCase() === genre.toLowerCase())?.id;

      response = await axios.get(`${baseUrl}/discover/movie`, {
        params: {
          api_key: apiKey,
          primary_release_year: year,
          with_genres: genreId,
          'vote_average.gte': rating,
          page: page,
        }
      });
    }

    const result = response.data.results.slice(0, 18);  // Limit to 18 movies per page
    const totalPages = Math.ceil(response.data.total_results / 18);
    res.render("index", { data: result, error: null, query, page: parseInt(page), totalPages });
  } catch (error) {
    console.error("Failed to make request:", error.message);
    res.render("index", {
      data: null,
      error: "No movies that match your criteria.",
      query,
      page: parseInt(page),
      totalPages: 0
    });
  }
});

app.listen(port, () => {
  console.log(`Server running on port: ${port}`);
});
