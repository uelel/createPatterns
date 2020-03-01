from flask import Flask, render_template      

app = Flask(__name__, static_url_path='/static')

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/barChart")
def barChart():
    return render_template("barChart.html")

@app.route("/barChart2")
def barChart2():
    return render_template("barChart2.html")

@app.route("/CChart")
def CChart():
    return render_template("candlestickChart.html")

@app.route("/animation")
def animation():
    return render_template("animation.html")

@app.route("/intBarChart")
def intBarChart():
    return render_template("intBarChart.html")

if __name__ == "__main__":
    app.run(debug=True)
