const express = require("express");

const app = express();
app.use(express.json());

const path = require("path");
const sqlite3 = require("sqlite3");

const { open } = require("sqlite");

const dbPath = path.join(__dirname, "moviesData.db");

let dataBase = null;

const initializeDbAndServer = async () => {
  try {
    dataBase = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB Error ${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    movieName: dbObject.movie_name,
  };
};

const convertMovieResultToResponseObject = (dbObject) => {
  return {
    movieId: dbObject.movie_id,
    directorId: dbObject.director_id,
    movieName: dbObject.movie_name,
    leadActor: dbObject.lead_actor,
  };
};

const convertDirectorArrayToResponse = (dbObject) => {
  return {
    directorId: dbObject.director_id,
    directorName: dbObject.director_name,
  };
};

const convertDirectorMovieToResponse = (dbObject) => {
  return {
    movieName: dbObject.movie_name,
  };
};

//API 1  get movies

app.get("/movies/", async (request, response) => {
  const getMoviesQuery = `
        SELECT 
          *
        FROM
            movie
        ORDER BY
            movie_id;    
    `;

  const moviesArray = await dataBase.all(getMoviesQuery);
  response.send(
    moviesArray.map((eachMovie) => convertDbObjectToResponseObject(eachMovie))
  );
});

//API 2 Post a movie

app.post("/movies/", async (request, response) => {
  const { directorId, movieName, leadActor } = request.body;
  const addMovieQuery = `INSERT INTO
    movie (director_id, movie_name, lead_actor)
    VALUES
        (${directorId}, '${movieName}', '${leadActor}');`;
  await dataBase.run(addMovieQuery);
  response.send("Movie Successfully Added");
});

//API 3

app.get("/movies/:movieId", async (request, response) => {
  const { movieId } = request.params;

  const getMovieQuery = `
        SELECT
          *
        FROM 
            movie
        WHERE 
            movie_id = '${movieId}';    
    `;
  const movieResult = await dataBase.get(getMovieQuery);
  response.send(convertMovieResultToResponseObject(movieResult));
});

//API 4 PUT

app.put("/movies/:movieId", async (request, response) => {
  const { movieId } = request.params;

  const { directorId, movieName, leadActor } = request.body;
  const updateMovieQuery = `
            UPDATE
              movie
            SET
              director_id = ${directorId},
              movie_name = '${movieName}',
              lead_actor = '${leadActor}'
            WHERE
              movie_id = ${movieId};`;

  await dataBase.run(updateMovieQuery);
  response.send("Movie Details Updated");
});

//API 5 Delete

app.delete("/movies/:movieId", async (request, response) => {
  const { movieId } = request.params;
  const deleteQuery = `
        DELETE FROM movie WHERE movie_id = ${movieId};
    `;
  await dataBase.run(deleteQuery);
  response.send("Movie Removed");
});

//API 6  directors Array

app.get("/directors/", async (request, response) => {
  const getDirectorsQuery = `SELECT * FROM director ORDER BY director_id;`;
  const directorArray = await dataBase.all(getDirectorsQuery);
  response.send(
    directorArray.map((eachDirector) =>
      convertDirectorArrayToResponse(eachDirector)
    )
  );
});

//API 7

app.get("/directors/:directorId/movies/", async (request, response) => {
  const { directorId } = request.params;
  const getDirectorMoviesQuery = `SELECT * FROM movie WHERE director_id = '${directorId}';`;
  const directorMoviesArray = await dataBase.all(getDirectorMoviesQuery);
  response.send(
    directorMoviesArray.map((eachMovie) => ({
      movieName: eachMovie.movie_name,
    }))
  );
});

module.exports = app;
